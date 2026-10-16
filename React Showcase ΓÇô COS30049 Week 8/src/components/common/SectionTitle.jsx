/**
 * SectionTitle – groups several DemoCards under a heading.
 *
 *   <SectionTitle title="Handling events" intro="React events look like HTML attributes..." />
 */
export default function SectionTitle({ title, intro }) {
  return (
    <>
      <h2 className="section-title">{title}</h2>
      {intro && <p className="section-intro">{intro}</p>}
    </>
  );
}
