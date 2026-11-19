const timeouts = require("../../config/timeouts");
const { withTimeout } = require("../utils/withTimeout");
const { normalizeMsError } = require("../errors/normalizeMsError");
const CommunicationError = require("../errors/CommunicationError");

const SHIFT_CODES = ["541", "542"];
const DETAIL_PAGE_SIZE = 500;

function toId(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function meetingPointsByShift(assignments = []) {
  const result = { "541": null, "542": null };
  for (const assignment of assignments) {
    if (SHIFT_CODES.includes(assignment.shiftCode)) {
      result[assignment.shiftCode] = assignment.meetingPointCode ?? null;
    }
  }
  return result;
}

function toStudentDto(roster, detail, assignments) {
  return {
    id: toId(roster.studentId),
    name: detail?.name ?? roster.name ?? null,
    active: roster.active !== false,
    routeId: toId(roster.routeId),
    routeCode: roster.routeCode ?? null,
    documentType: detail?.documentType ?? null,
    documentNumber: detail?.documentNumber ?? null,
    address: detail?.address ?? null,
    phone: detail?.phone ?? null,
    grade: detail?.grade ?? null,
    schoolShift: detail?.schoolShift ?? null,
    section: detail?.section ?? null,
    schoolId: toId(detail?.schoolId),
    guardians: (detail?.guardians ?? []).map((guardian) => ({
      id: toId(guardian.userId),
      name: guardian.name ?? null,
      phone: guardian.phone ?? null,
      relationship: guardian.relationship ?? null,
      primary: guardian.isPrimary === true,
    })),
    meetingPoints: meetingPointsByShift(assignments),
  };
}

function groupedByStudent(assignments = []) {
  const grouped = new Map();
  for (const assignment of assignments) {
    const studentId = toId(assignment.studentId);
    if (studentId === null) {
      continue;
    }
    const list = grouped.get(studentId) ?? [];
    list.push(assignment);
    grouped.set(studentId, list);
  }
  return grouped;
}

function validationError(code, message, details = null) {
  return new CommunicationError({
    type: "VALIDATION",
    code,
    message,
    status: 400,
    details,
  });
}

function createStudentsOrchestrator({ usersService, routesService }) {
  async function loadDetails(roster, headers, correlationId) {
    const ids = new Set(
      roster.map((student) => toId(student.studentId)).filter((id) => id !== null)
    );
    const details = new Map();
    if (ids.size === 0) {
      return details;
    }

    const page = await usersService.listStudents(
      { page: 0, size: Math.max(DETAIL_PAGE_SIZE, ids.size) },
      headers,
      correlationId
    );
    for (const student of page?.content ?? []) {
      const id = toId(student.userId);
      if (id !== null && ids.has(id)) {
        details.set(id, student);
      }
    }

    const missing = [...ids].filter((id) => !details.has(id));
    await Promise.allSettled(
      missing.map(async (id) => {
        try {
          details.set(id, await usersService.getStudent(id, headers, correlationId));
        } catch {
          // El roster sigue siendo util aunque admin_users no tenga el detalle.
        }
      })
    );
    return details;
  }

  async function getOne(studentId, headers, correlationId) {
    const [roster, assignments] = await Promise.all([
      routesService.getStudent(studentId, headers, correlationId),
      routesService.getStudentMeetingPoints(studentId, headers, correlationId),
    ]);
    let detail = null;
    try {
      detail = await usersService.getStudent(studentId, headers, correlationId);
    } catch {
      detail = null;
    }
    return toStudentDto(roster, detail, assignments);
  }

  async function assignMeetingPoints(studentId, routeId, meetingPoints, headers, correlationId) {
    const requested = Object.entries(meetingPoints ?? {}).filter(
      ([shiftCode, code]) => SHIFT_CODES.includes(shiftCode) && code
    );
    if (requested.length === 0) {
      return;
    }

    const points = await routesService.listMeetingPointsForRoute(
      routeId,
      headers,
      correlationId
    );
    const byCode = new Map(
      (points ?? []).map((point) => [point.meetingPointCode, point.meetingPointId])
    );
    const assignments = requested.map(([shiftCode, code]) => {
      const meetingPointId = byCode.get(code);
      if (meetingPointId === undefined) {
        throw validationError(
          "GW_UNKNOWN_MEETING_POINT",
          `El punto de encuentro "${code}" no pertenece a la ruta ${routeId}.`,
          { meetingPointCode: code, routeId: toId(routeId) }
        );
      }
      return { shiftCode, meetingPointId };
    });

    await routesService.assignStudentMeetingPoints(
      studentId,
      { assignments },
      headers,
      correlationId
    );
  }

  return {
    async listByRoute(routeId, headers, correlationId) {
      const work = (async () => {
        const [roster, assignments] = await Promise.all([
          routesService.listStudentsByRoute(routeId, headers, correlationId),
          routesService.listRouteStudentsMeetingPoints(routeId, headers, correlationId),
        ]);
        const details = await loadDetails(roster, headers, correlationId);
        const grouped = groupedByStudent(assignments);
        return roster.map((student) =>
          toStudentDto(
            student,
            details.get(toId(student.studentId)) ?? null,
            grouped.get(toId(student.studentId)) ?? []
          )
        );
      })();

      try {
        return await withTimeout(work, timeouts.defaults.orchestrator, {
          label: `students.listByRoute:${routeId}`,
        });
      } catch (error) {
        if (error.name === "OrchestratorTimeoutError") {
          throw normalizeMsError(error, { correlationId });
        }
        throw error;
      }
    },

    getOne(studentId, headers, correlationId) {
      return getOne(studentId, headers, correlationId);
    },

    async create(routeId, payload, headers, correlationId) {
      const { user = {}, student = {}, meetingPoints = {} } = payload ?? {};
      const route = await routesService.getRoute(routeId, headers, correlationId);
      const schoolId = student.schoolId ?? route?.schoolId ?? null;

      const created = await usersService.createStudent(
        {
          user: { ...user, role: "STUDENT" },
          student: { ...student, schoolId },
        },
        headers,
        correlationId
      );
      const studentId = toId(created?.userId ?? created?.id);
      if (studentId === null) {
        throw new CommunicationError({
          type: "UPSTREAM",
          code: "MS_USERS_INVALID_RESPONSE",
          message: "admin_users no devolvio el identificador del estudiante creado.",
          service: "users",
          status: 502,
        });
      }

      try {
        await routesService.assignStudentToRoute(
          routeId,
          {
            studentId,
            name: user.name ?? created?.name ?? "",
          },
          headers,
          correlationId
        );
        await assignMeetingPoints(
          studentId,
          routeId,
          meetingPoints,
          headers,
          correlationId
        );
      } catch (error) {
        if (error instanceof CommunicationError) {
          error.details = {
            createdStudentId: studentId,
            ...(error.details && typeof error.details === "object" ? error.details : {}),
          };
        }
        throw error;
      }

      return getOne(studentId, headers, correlationId);
    },

    async update(studentId, payload, headers, correlationId) {
      const { student = {}, meetingPoints } = payload ?? {};
      const roster = await routesService.getStudent(studentId, headers, correlationId);

      if (student && Object.keys(student).length > 0) {
        const route =
          student.schoolId === undefined && roster?.routeId !== undefined
            ? await routesService.getRoute(roster.routeId, headers, correlationId)
            : null;
        await usersService.updateStudent(
          studentId,
          { ...student, schoolId: student.schoolId ?? route?.schoolId },
          headers,
          correlationId
        );
      }

      if (meetingPoints !== undefined) {
        await assignMeetingPoints(
          studentId,
          roster?.routeId,
          meetingPoints,
          headers,
          correlationId
        );
      }

      return getOne(studentId, headers, correlationId);
    },
  };
}

module.exports = createStudentsOrchestrator;
