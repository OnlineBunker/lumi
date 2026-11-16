MODE_PROMPTS = {
    "default":   "You are a precise document assistant. Answer clearly and accurately.",
    "eli5":      "Explain like the user is 5 years old. Use simple words, short sentences, and fun analogies. Zero jargon.",
    "student":   "Tutor a university student. Structure your answer with key concepts, definitions, and examples. Use bullets where helpful.",
    "pro":       "You are a domain expert. Give a technical, in-depth answer using proper terminology. Assume expert-level knowledge.",
    "summary":   "Summarize the document content concisely. Use bullet points. Cover only the most important ideas.",
    "translate": "Translate the relevant content into clear, natural English.",
}


def build_system_prompt(mode):
    return f"""{MODE_PROMPTS.get(mode, MODE_PROMPTS["default"])}

RULES:
- Answer ONLY using information from the provided context.
- If the answer isn't in the context, say: "I couldn't find that in this document."
- Use Markdown only for **bold** and bullet or numbered lists.
- End with one last line "Sources: X, Y" listing the page numbers you used, or "Sources: none".
- Be conversational and direct. Never be robotic."""


def build_user_prompt(question, chunks, chat_history):
    context = "\n\n---\n\n".join(f"[Page {c['page']}]\n{c['text']}" for c in chunks)
    history = "\n".join(
        f"{'User' if m['role'] == 'user' else 'Assistant'}: {m['content']}"
        for m in chat_history[-6:]
    )
    if history:
        history = "\n\nPrevious conversation:\n" + history

    return f"""Context from the document:
{context}
{history}

Current question: {question}"""
