import { useState } from 'react';
import DonutChart from './DonutChart.jsx';


const SIZE = 220;
const CENTER = SIZE / 2;
const OUTER = 100;
const INNER = 64;

// Each attack category always uses the same colour
const COLORS = {
    obfuscation: '#9b78d6',
    role_playing: '#e4ad55',
    data_leakage: '#e16b65',
    code_execution: '#5b93d3',
    jailbreaking: '#50ab84'
};

// Calculate a point on a circle
function polar(angle, radius) {
    return [
        CENTER + radius * Math.sin(angle),
        CENTER - radius * Math.cos(angle)
    ];
}

// Create an SVG donut slice
function slicePath(startAngle, endAngle) {
    // SVG arcs cannot describe a full circle in one arc
    if (endAngle - startAngle >= Math.PI * 2 - 0.000001) {
        endAngle = startAngle + Math.PI * 2 - 0.000001;
    }

    const [x1, y1] = polar(startAngle, OUTER);
    const [x2, y2] = polar(endAngle, OUTER);
    const [x3, y3] = polar(endAngle, INNER);
    const [x4, y4] = polar(startAngle, INNER);

    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    return [
        `M${x1},${y1}`,
        `A${OUTER},${OUTER} 0 ${largeArc} 1 ${x2},${y2}`,
        `L${x3},${y3}`,
        `A${INNER},${INNER} 0 ${largeArc} 0 ${x4},${y4}`,
        'Z'
    ].join(' ');
}


function AttackCountDonut({ categories = [], isPending = false }) {
    const [hovered, setHovered] = useState(null);

    // Ignore invalid or zero counts
    const validCategories = categories.filter(
        item => Number.isFinite(item.count) && item.count > 0
    );

    const total = validCategories.reduce(
        (sum, item) => sum + item.count, 0
    );

    // Convert category counts into donut slices
    const slices = validCategories.reduce((acc, item) => {
        const start = acc.length > 0
            ? acc[acc.length - 1].end
            : 0;

        const end = start + (item.count / total) * Math.PI * 2;

        return [
            ...acc,
            {
                ...item,
                start,
                end,
                color: COLORS[item.attackType] || '#94a3b8'
            }
        ];
    }, []);

    const active = hovered === null ? null : slices[hovered];

    return (
        <div className="attack-count-donut">
            <h4>Attack Category Distribution</h4>
            <div className="safety-metrics__content">

                <DonutChart
                    segments={validCategories.map(item => ({
                        value: item.count,
                        color: COLORS[item.attackType] || "#94a3b8"
                    }))}
                    centerValue={isPending ? "Verifying..." : active ? active.count : total}
                    centerLabel="Total Matches"
                    hovered={hovered}
                    onHover={setHovered}
                />

                {/* Legend */}
                {!isPending && (
                <div className="safety-metrics__legend">
                    {slices.map((slice, index) => (
                        <div
                            key={slice.attackType}
                            className="safety-metrics__legend-item"
                            onPointerEnter={() => setHovered(index)}
                            onPointerLeave={() => setHovered(null)}
                        >
                            <span
                                className="safety-metrics__swatch"
                                style={{ backgroundColor: slice.color }}
                            />
                            <span>{slice.label}</span>
                            <strong>
                                {Math.round((slice.count / total) * 100)}%
                            </strong>
                        </div>
                    ))}
                </div>
                )}

            </div>
        </div>
    );
}

export default AttackCountDonut;
