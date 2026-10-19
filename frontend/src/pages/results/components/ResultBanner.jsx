const bannerContent = {
  allowed: {
    title: "Prompt Cleared & Allowed",
    message: "No severe injection indicators detected.",
    icon: "/icons/allowed.png"
  },

  blocked: {
    title: "Prompt Security Risk Blocked",
    message: "Potential prompt injection indicators detected.",
    icon: "/icons/blocked.png"
  },

  pending: {
    title: "Analyzing Payload Security...",
    message: "Running guardrail diagnostics.",
    icon: "/icons/pending.png"
  }
};

function ResultBanner({ status }) {
  const banner = bannerContent[status];
  return (
    <section
      className={`result-banner result-banner--${status}`}
      role="status"
    >
      <img
        src={banner.icon}
        alt=""
        className="result-banner__icon"
      />
      <div>
        <h2>{banner.title}</h2>
        <p>{banner.message}</p>
      </div>
    </section>
  );
}

export default ResultBanner;
