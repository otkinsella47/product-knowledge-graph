const concepts = [
  'Research',
  'Insight',
  'Goal',
  'Opportunity',
  'Solution',
  'Experiment',
  'Decision',
  'Outcome',
];

function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16 sm:px-8">
        <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-cyan-300">
          v0.1 validation prototype
        </p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-6xl">
          Product Knowledge Graph
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          An AI-native product knowledge system for connecting research,
          insights, opportunities, decisions and outcomes as a navigable graph.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {concepts.map((concept) => (
            <div
              className="rounded-lg border border-slate-700 bg-slate-900 p-4 shadow-sm"
              key={concept}
            >
              <p className="text-sm font-medium text-slate-300">{concept}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 max-w-2xl text-base leading-7 text-slate-400">
          The first milestone is intentionally small: make product knowledge
          relationships visible enough to learn whether the model is useful.
        </p>
      </section>
    </main>
  );
}

export default App;
