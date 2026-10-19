function SubmittedPrompt({ prompt = "", highlightedSpans = [] }) {
    const parts = [];
    let position = 0;

    // Sort highlighted phrases by position
    const spans = [...highlightedSpans].sort((a, b) => a.start - b.start);

    for (const span of spans) {
        // Skip invalid or overlapping positions
        if (span.start < position || span.end <= span.start || span.end > prompt.length) {
            continue;
        }

        // Normal text
        parts.push(prompt.slice(position, span.start));
        //https://stackoverflow.com/questions/71287654/highlight-text-using-mark-on-react-js
        // Highlighted text
        parts.push(
            <mark key={span.start}>
                {prompt.slice(span.start, span.end)}
            </mark>
        );

        position = span.end;
    }

    // Remaining text
    parts.push(prompt.slice(position));

    return (
        <section className="submitted-prompt">
            <h3>Submitted Prompt Payload</h3>
            <div className="submitted-prompt__text">
                {parts}
            </div>
        </section>
    );
}

export default SubmittedPrompt;
