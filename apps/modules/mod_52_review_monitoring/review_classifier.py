class ReviewSentimentClassifier:
    POSITIVE_WORDS = {"great", "love", "best", "fast", "awesome", "useful"}
    NEGATIVE_WORDS = {"crash", "bug", "terrible", "slow", "broken", "freeze"}

    @classmethod
    def classify(cls, review_text: str) -> str:
        text = review_text.lower()
        pos = sum(1 for w in cls.POSITIVE_WORDS if w in text)
        neg = sum(1 for w in cls.NEGATIVE_WORDS if w in text)
        if neg > pos:
            return "NEGATIVE"
        elif pos > neg:
            return "POSITIVE"
        return "NEUTRAL"
