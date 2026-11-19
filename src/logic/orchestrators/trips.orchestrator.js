const timeouts = require("../../config/timeouts");
const { withTimeout } = require("../utils/withTimeout");
const { normalizeMsError } = require("../errors/normalizeMsError");

function toId(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toStatus(trip) {
  if (trip.actualEndAt) {
    return "FINISHED";
  }
  if (trip.actualStartAt) {
    return "IN_PROGRESS";
  }
  return "SCHEDULED";
}

function toGuideDto(guide) {
  return {
    guideId: toId(guide.actualGuideId ?? guide.plannedGuideId),
    name: guide.actualGuideNameSnapshot ?? guide.plannedGuideNameSnapshot ?? null,
    primary: guide.assignmentRole === "MAIN",
  };
}

function toTripDto(trip, guides = []) {
  const scheduledStart =
    trip.scheduledStartSnapshot ?? trip.scheduledStart ?? null;
  return {
    id: toId(trip.tripId ?? trip.id),
    routeId: toId(trip.routeId),
    routeCode: trip.routeCodeSnapshot ?? trip.routeCode ?? null,
    tripCode: trip.shiftCodeSnapshot ?? trip.tripCode ?? null,
    date: trip.tripDate ?? trip.date ?? null,
    schoolName: trip.schoolNameSnapshot ?? trip.schoolName ?? null,
    scheduledStart,
    // admin_operations no guarda una hora de citacion distinta del inicio.
    citationTime: scheduledStart,
    requiredGuides: Math.max(1, Math.min(2, (guides ?? []).length || 1)),
    status: toStatus(trip),
    startedAt: trip.actualStartAt ?? null,
    endedAt: trip.actualEndAt ?? null,
    guides: (guides ?? []).map(toGuideDto),
    // admin_operations no modela ejecutores del recorrido.
    executors: [],
  };
}

function toTripSummary(trip, attendance) {
  const presentCount = (attendance ?? []).filter(
    (row) => row?.statusCode === "01"
  ).length;
  const startedAt = trip.actualStartAt ?? null;
  const endedAt = trip.actualEndAt ?? null;
  return {
    tripId: toId(trip.tripId ?? trip.id),
    startedAt,
    endedAt,
    durationMinutes:
      startedAt && endedAt
        ? Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000)
        : 0,
    presentCount,
    enrolledCount: (attendance ?? []).length,
  };
}

async function withGuides(operationsService, trip, headers, correlationId) {
  try {
    const guides = await operationsService.listTripGuides(
      trip.tripId ?? trip.id,
      headers,
      correlationId
    );
    return toTripDto(trip, guides);
  } catch {
    return toTripDto(trip, []);
  }
}

function createTripsOrchestrator(operationsService) {
  return {
    async getOverview(tripId, headers, correlationId) {
      const work = Promise.all([
        operationsService.getTrip(tripId, headers, correlationId),
        operationsService.listTripGuides(tripId, headers, correlationId),
        operationsService.listStudentAttendance(tripId, headers, correlationId),
        operationsService.listTripEvents(tripId, headers, correlationId),
      ]).then(([trip, guides, attendance, events]) => ({
        trip,
        guides,
        attendance,
        events,
      }));

      try {
        return await withTimeout(work, timeouts.defaults.orchestrator, {
          label: `trips.overview:${tripId}`,
        });
      } catch (error) {
        if (error.name === "OrchestratorTimeoutError") {
          throw normalizeMsError(error, { correlationId });
        }
        throw error;
      }
    },

    async list(date, guideId, headers, correlationId) {
      const work = (async () => {
        const trips = await operationsService.listTripsByDate(
          date,
          guideId,
          headers,
          correlationId
        );
        return Promise.all(
          (trips ?? []).map((trip) =>
            withGuides(operationsService, trip, headers, correlationId)
          )
        );
      })();

      try {
        return await withTimeout(work, timeouts.defaults.orchestrator, {
          label: `trips.list:${date}`,
        });
      } catch (error) {
        if (error.name === "OrchestratorTimeoutError") {
          throw normalizeMsError(error, { correlationId });
        }
        throw error;
      }
    },

    async get(tripId, headers, correlationId) {
      const trip = await operationsService.getTrip(tripId, headers, correlationId);
      return withGuides(operationsService, trip, headers, correlationId);
    },

    async getByRouteAndDate(routeId, date, headers, correlationId) {
      const trip = await operationsService.getTripByRouteAndDate(
        routeId,
        date,
        headers,
        correlationId
      );
      return withGuides(operationsService, trip, headers, correlationId);
    },

    async start(tripId, headers, correlationId) {
      const trip = await operationsService.startTrip(
        tripId,
        undefined,
        headers,
        correlationId
      );
      return withGuides(operationsService, trip, headers, correlationId);
    },

    async finish(tripId, headers, correlationId) {
      const trip = await operationsService.finishTrip(
        tripId,
        undefined,
        headers,
        correlationId
      );
      const attendance = await operationsService.listStudentAttendance(
        tripId,
        headers,
        correlationId
      );
      return toTripSummary(trip, attendance);
    },
  };
}

module.exports = createTripsOrchestrator;
