import AttackCountDonut from './AttackCountDonut.jsx';
import ConfidenceDonut from './ConfidenceDonut.jsx';
import FlipCard from './FlipCard.jsx';

function SafetyMetrics({ categories = [], status, attackTypeConfidences = null }) {
    const isPending = status === "pending";

    return (
        <section className="safety-metrics">
            <FlipCard
                front={
                    <AttackCountDonut
                        categories={isPending ? [] : categories}
                        isPending={isPending}
                    />
                }
                back={
                    <ConfidenceDonut
                        status={status}
                        confidences={attackTypeConfidences}
                    />
                }
            />
        </section>
    );
}

export default SafetyMetrics;
