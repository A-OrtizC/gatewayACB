const timeouts = require("../../config/timeouts");
const { withTimeout } = require("../utils/withTimeout");
const { normalizeMsError } = require("../errors/normalizeMsError");
const CommunicationError = require("../errors/CommunicationError");

const STATUS_PRESENT = "01";
const STATUS_ABSENT = "00";

function validationError(code, message, details = null) {
  return new CommunicationError({
    type: "VALIDATION",
    code,
    message,
    status: 400,
    details,
  });
}

function normalizeRecords(records) {
  if (!Array.isArray(records) || records.length === 0) {
    throw validationError(
      "GW_ATTENDANCE_EMPTY",
      "La asistencia debe incluir al menos un estudiante."
    );
  }
  return records.map((record, index) => {
    if (
      !record ||
      record.studentId === undefined ||
      record.studentId === null ||
      !record.studentName
    ) {
      throw validationError(
        "GW_ATTENDANCE_INVALID",
        "Cada registro de asistencia requiere studentId y studentName.",
        { index }
      );
    }
    return {
      studentId: Number(record.studentId),
      studentName: String(record.studentName).trim(),
      present: record.present === true,
    };
  });
}

function toAttendanceRow(row) {
  const statusCode = row?.statusCode ?? null;
  return {
    studentId: Number(row?.id?.studentId ?? row?.studentId),
    studentName: row?.studentNameSnapshot ?? row?.studentName ?? null,
    statusCode,
    present: statusCode === STATUS_PRESENT,
  };
}

function toHistoryRow(row) {
  return {
    date: row?.date ?? null,
    tripCode: row?.tripCode ?? null,
    tripId: row?.tripId ?? null,
    studentId: Number(row?.studentId),
    studentName: row?.studentName ?? null,
    statusCode: row?.statusCode ?? null,
    present: row?.statusCode === STATUS_PRESENT,
  };
}

function createAttendanceOrchestrator(operationsService) {
  return {
    async save(tripId, payload, headers, correlationId) {
      const records = normalizeRecords(payload?.records);

      await operationsService.initializeRoster(
        tripId,
        records.map((record) => ({
          studentId: record.studentId,
          studentName: record.studentName,
        })),
        headers,
        correlationId
      );

      const work = Promise.allSettled(
        records.map((record) =>
          operationsService.registerOrUpdateAttendance(
            tripId,
            record.studentId,
            {
              studentNameSnapshot: record.studentName,
              statusCode: record.present ? STATUS_PRESENT : STATUS_ABSENT,
            },
            headers,
            correlationId
          )
        )
      );

      let results;
      try {
        results = await withTimeout(work, timeouts.defaults.orchestrator, {
          label: `attendance.save:${tripId}`,
        });
      } catch (error) {
        if (error.name === "OrchestratorTimeoutError") {
          throw normalizeMsError(error, { correlationId });
        }
        throw error;
      }

      const failed = results
        .map((result, index) => ({ result, record: records[index] }))
        .filter(({ result }) => result.status === "rejected");

      if (failed.length > 0) {
        const firstError = failed[0].result.reason;
        const normalized =
          firstError instanceof CommunicationError
            ? firstError
            : normalizeMsError(firstError, { correlationId });
        normalized.details = {
          failed: failed.map(({ record }) => record.studentId),
          saved: records.length - failed.length,
        };
        throw normalized;
      }

      return { saved: records.length };
    },

    async listByTrip(tripId, headers, correlationId) {
      const rows = await operationsService.listStudentAttendance(
        tripId,
        headers,
        correlationId
      );
      return (rows ?? []).map(toAttendanceRow);
    },

    async history(routeId, from, to, headers, correlationId) {
      if (!from || !to) {
        throw validationError(
          "GW_ATTENDANCE_RANGE_REQUIRED",
          "El historial de asistencia requiere las fechas from y to."
        );
      }
      if (from > to) {
        throw validationError(
          "GW_ATTENDANCE_RANGE_INVALID",
          "La fecha inicial no puede ser posterior a la final."
        );
      }
      const rows = await operationsService.listAttendanceByRoute(
        routeId,
        from,
        to,
        headers,
        correlationId
      );
      return (rows ?? []).map(toHistoryRow);
    },
  };
}

module.exports = createAttendanceOrchestrator;
