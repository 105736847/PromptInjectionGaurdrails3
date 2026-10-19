function PromptHistory({ history = [], selectedId, onSelect }) {
    return (
        <section className="prompt-history">
            <h3>Prompt History</h3>

            {history.length === 0 ? (
                <p>No previous prompts found.</p>
            ) : (
                <div className="history-table-wrapper">
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>Submitted Prompt</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((item) => (
                                <tr key={item.id}>
                                    {/* Submitted prompt */}
                                    <td className="history-prompt">
                                        {item.prompt}
                                    </td>
                                    {/* Date of analysis */}
                                    <td>
                                        {new Date(item.checkedAt).toLocaleString('en-AU', {
                                            dateStyle: 'medium',
                                            timeStyle: 'short'
                                        })}
                                    </td>

                                    {/* Prediction status */}
                                    <td>
                                        <span className={`history-status history-status--${item.status}`}>
                                            {item.status}
                                        </span>
                                    </td>

                                    {/* View previous result */}
                                    <td>
                                        <button
                                            type="button"
                                            className="history-view-btn"
                                            onClick={() => onSelect(item)}
                                            disabled={selectedId === item.id}
                                        >
                                            {selectedId === item.id ? "Selected" : "View"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

export default PromptHistory;
