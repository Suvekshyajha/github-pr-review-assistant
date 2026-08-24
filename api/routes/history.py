from fastapi import APIRouter, HTTPException
from api.db import get_all_reviews, get_review_by_id

router = APIRouter()

@router.get("/history")
def list_reviews():
    return get_all_reviews()

@router.get("/history/{review_id}")
def get_review(review_id: int):
    review = get_review_by_id(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return review