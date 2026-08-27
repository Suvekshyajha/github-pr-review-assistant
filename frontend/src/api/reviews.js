import { apiRequest } from "./client";

export function listReviews() {
  return apiRequest("/history");
}

export function getReview(reviewId) {
  return apiRequest(`/history/${reviewId}`);
}

export function runReview(reviewData) {
  return apiRequest("/review", {
    method: "POST",
    body: JSON.stringify(reviewData),
  });
}