from typing import List

# Each UI button maps to a unique system instruction
MODE_PROMPTS = {
    "default":   "You are a precise document assistant. Answer clearly and accurately.",
    "eli5":      "Explain like the user is 5 years old. Use simple words, short sentences, and fun analogies. Zero jargon.",
    "student":   "Tutor a university student. Structure your answer with key concepts, definitions, and examples. Use bullets where helpful.",
    "pro":       "You are a domain expert. Give a technical, in-depth answer using proper terminology. Assume expert-level knowledge.",
    "summary":   "Summarize the document content concisely. Use bullet points. Cover only the most important ideas.",
    "translate": "Translate the relevant content into clear, natural English.",
}


def build_system_prompt(mode: str) -> str:
    base = MODE_PROMPTS.get(mode, MODE_PROMPTS["default"])
    return f"""{base}

RULES:
- Answer ONLY using information from the provided context.
- If the answer isn't in the context, say: "I couldn't find that in this document."
- Always end your answer with: "📄 Sources: Page X, Page Y" listing the pages you used.
- Be conversational and direct. Never be robotic."""


def build_user_prompt(question: str, chunks: List[dict], chat_history: List[dict] = None) -> str:
    # Format context with page numbers for traceability
    context = "\n\n---\n\n".join(
        f"[Page {c['page']}]\n{c['text']}" for c in chunks
    )

    # Include last 3 exchanges for follow-up question awareness
    history_text = ""
    if chat_history:
        lines = []
        for msg in chat_history[-6:]:
            role = "User" if msg["role"] == "user" else "Assistant"
            lines.append(f"{role}: {msg['content']}")
        history_text = "\n\nPrevious conversation:\n" + "\n".join(lines)

    return f"""Context from the document:
{context}
{history_text}

Current question: {question}"""
