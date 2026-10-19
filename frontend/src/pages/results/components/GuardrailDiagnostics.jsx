const diagnosticItems = [
    {
        key: "attack_phrase_count",
        label: "Attack Phrase Matches",
        description: "Known prompt injection phrases"
    },
    {
        key: "override_phrase_count",
        label: "Instruction Override Matches",
        description: "Instructions attempting to override rules"
    },
    {
        key: "suspicious_action_count",
        label: "Suspicious Action Matches",
        description: "Potentially suspicious requested actions"
    },
    {
        key: "sensitive_target_count",
        label: "Sensitive Target Matches",
        description: "References to potentially sensitive information"
    }
];




function GuardrailDiagnostics({ features, status }) {
    return (
        <section className="guardrail-diagnostics">
            <h3>Guardrail Diagnostics</h3>

            {status === "pending" ? (
                <p className="diagnostics-message">
                    Analyzing prompt...
                </p>
            ) : !features ? (
                <p className="diagnostics-message">
                    Diagnostic data unavailable.
                </p>
            ) : (
                <div className="diagnostics-list">
                    {diagnosticItems.map((item) => {
                        const count = features[item.key];
                        const validCount = Number.isInteger(count) && count >= 0;

                        return (
                            <div className="diagnostics-row" key={item.key}>
                                <div>
                                    <h4>{item.label}</h4>
                                    <p>{item.description}</p>
                                </div>

                                <span
                                    className={
                                        validCount && count > 0
                                            ? "diagnostics-count diagnostics-count--detected"
                                            : "diagnostics-count"
                                    }
                                >
                                    {validCount ? count : "N/A"}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

export default GuardrailDiagnostics;
