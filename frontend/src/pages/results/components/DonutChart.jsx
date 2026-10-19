function DonutChart({
    segments = [],
    centerValue,
    centerLabel,
    hovered = null,
    onHover
}) {
    const total = segments.reduce(
        (sum, item) => sum + item.value, 0
    );

    let position = 0;

    return (
        <svg
            viewBox="0 0 220 220"
            className="safety-metrics__chart"
            role="img"
            aria-label={`${centerLabel}: ${centerValue}`}
        >
            {/* Grey background donut */}
            <circle
                cx="110"
                cy="110"
                r="82"
                fill="none"
                stroke="#edf1f5"
                strokeWidth="36"
            />

            {/* Coloured segments */}
            {segments.map((item, index) => {
                const percentage = total > 0
                    ? (item.value / total) * 100
                    : 0;

                const start = position;
                position += percentage;

                return (
                    <circle
                        key={index}
                        cx="110"
                        cy="110"
                        r="82"
                        fill="none"
                        stroke={item.color}
                        strokeWidth="36"
                        pathLength="100"
                        strokeDasharray={`${percentage} ${100 - percentage}`}
                        strokeDashoffset={-start}
                        transform="rotate(-90 110 110)"
                        opacity={hovered !== null && hovered !== index ? 0.3 : 1}
                        onPointerEnter={() => onHover?.(index)}
                        onPointerLeave={() => onHover?.(null)}
                    />
                );
            })}

            {/* Centre value */}
            <text
                x="110"
                y="105"
                textAnchor="middle"
                fontSize={typeof centerValue === "number" ? 28 : 18}
                fontWeight="bold"
                fill="#111827"
            >
                {centerValue}
            </text>

            {/* Centre label */}
            <text
                x="110"
                y="126"
                textAnchor="middle"
                fontSize="11"
                fill="#64748b"
            >
                {centerLabel}
            </text>
        </svg>
    );
}

export default DonutChart;
