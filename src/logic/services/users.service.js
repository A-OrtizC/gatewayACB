const { createRepositoryCaller } = require("../utils/callRepository");

function createUsersService(repository) {
  const callRepository = createRepositoryCaller();

  return {
    listGuides(query, headers, correlationId) {
      return callRepository(
        () => repository.findAllGuides(query, headers),
        correlationId
      );
    },

    getGuide(id, headers, correlationId) {
      return callRepository(
        () => repository.findGuideById(id, headers),
        correlationId
      );
    },

    createGuide(data, headers, correlationId) {
      return callRepository(
        () => repository.createGuide(data, headers),
        correlationId
      );
    },

    updateGuide(id, data, headers, correlationId) {
      return callRepository(
        () => repository.updateGuide(id, data, headers),
        correlationId
      );
    },

    listStudents(query, headers, correlationId) {
      return callRepository(
        () => repository.findAllStudents(query, headers),
        correlationId
      );
    },

    listStudentsBySchool(schoolId, query, headers, correlationId) {
      return callRepository(
        () => repository.findStudentsBySchool(schoolId, query, headers),
        correlationId
      );
    },

    getStudent(id, headers, correlationId) {
      return callRepository(
        () => repository.findStudentById(id, headers),
        correlationId
      );
    },

    createStudent(data, headers, correlationId) {
      return callRepository(
        () => repository.createStudent(data, headers),
        correlationId
      );
    },

    updateStudent(id, data, headers, correlationId) {
      return callRepository(
        () => repository.updateStudent(id, data, headers),
        correlationId
      );
    },

    assignGuardian(id, data, headers, correlationId) {
      return callRepository(
        () => repository.assignGuardianToStudent(id, data, headers),
        correlationId
      );
    },

    search(query, headers, correlationId) {
      return callRepository(
        () => repository.searchByDocument(query.type, query.number, headers),
        correlationId
      );
    },
  };
}

module.exports = createUsersService;
