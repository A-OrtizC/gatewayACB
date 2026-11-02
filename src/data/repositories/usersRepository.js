const { get, post, put, patch, del } = require("../clients/httpClient");

const BASE_URL = "/api/v1";
const GUIDES_RESOURCE = `${BASE_URL}/guides`;
const SEARCH_RESOURCE = `${BASE_URL}/search`;
const STUDENTS_RESOURCE = `${BASE_URL}/students`;

const UsersRepository = {
  // Guides methods
  createGuide: (data, headers = {}) => {
    return post("users", GUIDES_RESOURCE, data, { headers });
  },

  findAllGuides: (query = {}, headers = {}) => {
    return get("users", GUIDES_RESOURCE, { headers, query });
  },

  findGuideById: (id, headers = {}) => {
    return get("users", `${GUIDES_RESOURCE}/${id}`, { headers });
  },

  updateGuide: (id, data, headers = {}) => {
    return put("guides", `${GUIDES_RESOURCE}/${id}`, data, { headers });
  },

  // Students methods
  createStudent: (data, headers = {}) => {
    return post("users", STUDENTS_RESOURCE, data, { headers });
  },

  assignGuardianToStudent: (id, guardianData, headers = {}) => {
    return post("users", `${STUDENTS_RESOURCE}/${id}/guardians`, guardianData, { headers });
  },

  findAllStudents: (pageable, headers = {}) => {
    return get("users", STUDENTS_RESOURCE, { headers, query: pageable });
  },

  findStudentsBySchool: (schoolId, pageable, headers = {}) => {
    return get("users", `${STUDENTS_RESOURCE}/school/${schoolId}`, { headers, query: pageable });
  },

  findStudentById: (id, headers = {}) => {
    return get("users", `${STUDENTS_RESOURCE}/${id}`, { headers });
  },

  updateStudent: (id, data, headers = {}) => {
    return put("users", `${STUDENTS_RESOURCE}/${id}`, data, { headers });
  },

  // Person Search methods
  searchByDocument: (type, number, headers = {}) => {
    return get("search", SEARCH_RESOURCE, { headers, query: { type, number } });
  },

};

module.exports = UsersRepository;
