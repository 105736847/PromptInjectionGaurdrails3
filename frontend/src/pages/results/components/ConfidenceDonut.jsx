import DonutChart from './DonutChart.jsx';

const CATEGORIES = [
    { key: 'benign', label: 'Benign', color: '#94a3b8' },
    { key: 'obfuscation', label: 'Obfuscation', color: '#9b78d6' },
    { key: 'role_playing', label: 'Role Playing', color: '#e4ad55' },
    { key: 'data_leakage', label: 'Data Leakage', color: '#e16b65' },
    { key: 'code_execution', label: 'Code Execution', color: '#5b93d3' },
    { key: 'jailbreaking', label: 'Jailbreaking', color: '#50ab84' }
];

function ConfidenceDonut({ status, confidences = null }) {

    const isPending = status === 'pending';

    const valid = confidences &&
        CATEGORIES.every(item =>
            Number.isFinite(confidences[item.key]) &&
            confidences[item.key] >= 0 &&
            confidences[item.key] <= 100
        ) &&
        Math.abs(
            CATEGORIES.reduce((sum, item) =>
                sum + confidences[item.key], 0
            ) - 100
        ) < 0.1;

    const segments = valid && !isPending
        ? CATEGORIES.map(item => ({
            value: confidences[item.key],
            color: item.color
        }))
        : [];

    return (
        <div className="confidence-donut">
            <h4>Attack Type Confidence</h4>

            <div className="safety-metrics__content">
                <DonutChart
                    segments={segments}
                    centerValue={isPending ? "Verifying..." : valid ? "100%" : "N/A"}
                    centerLabel={isPending ? "Confidence" : "Distribution"}
                />

                {valid && !isPending && (
                    <div className="safety-metrics__legend">
                        {CATEGORIES.map(item => (
                            <div
                                key={item.key}
                                className="safety-metrics__legend-item"
                            >
                                <span
                                    className="safety-metrics__swatch"
                                    style={{ backgroundColor: item.color }}
                                />
                                <span>{item.label}</span>
                                <strong>{confidences[item.key]}%</strong>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ConfidenceDonut;
