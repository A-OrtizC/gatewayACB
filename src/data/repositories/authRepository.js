const { get, post, put, patch, del } = require("../clients/httpClient");

const URL_BASE = "/api/v1/auth";

const AuthRepository = {
  login: (data, headers = {}) => {
    url = `${URL_BASE}/login`;
    return post("auth", url, data, { headers });
  },
};

module.exports = AuthRepository;
