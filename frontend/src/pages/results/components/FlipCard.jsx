
import { useState } from 'react';

function FlipCard({ front, back }) {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <>
            <h3>Safety Metrics Breakdown</h3>

            <div className={`safety-flip ${isFlipped ? 'is-flipped' : ''}`}>
                <div className="safety-flip-inner">

                    {/* Front: Attack counts */}
                    <div className="safety-flip-face" aria-hidden={isFlipped}>
                        {front}

                        <div className="safety-flip-actions">
                            <button
                                type="button"
                                tabIndex={isFlipped ? -1 : 0}
                                onClick={() => setIsFlipped(true)}
                            >
                                Show Confidence
                            </button>
                        </div>
                    </div>

                    {/* Back: Confidence */}
                    <div className="safety-flip-face safety-flip-back" aria-hidden={!isFlipped}>
                        {back}

                        <div className="safety-flip-actions">
                            <button
                                type="button"
                                tabIndex={isFlipped ? 0 : -1}
                                onClick={() => setIsFlipped(false)}
                            >
                                Show Counts
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}

export default FlipCard;
