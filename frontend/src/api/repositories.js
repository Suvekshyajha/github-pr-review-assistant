import { apiRequest } from "./client";

export function listRepositories() {
  return apiRequest("/repos");
}

export function connectRepository(repository) {
  return apiRequest("/repos/connect", {
    method: "POST",
    body: JSON.stringify(repository),
  });
}

export function deleteRepository(repositoryId) {
  return apiRequest(`/repos/${repositoryId}`, {
    method: "DELETE",
  });
}