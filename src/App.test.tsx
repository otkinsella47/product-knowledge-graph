import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the entity management workspace', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: /entity workspace/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('form', { name: /create entity/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/no entities yet/i)).toBeInTheDocument();
  });

  it('creates and views an entity', async () => {
    const user = userEvent.setup();

    render(<App />);

    await createEntity({
      user,
      title: 'Users miss onboarding value',
      description: 'Research shows onboarding copy is unclear.',
      type: 'Insight',
    });

    expect(screen.getAllByText(/users miss onboarding value/i)).toHaveLength(2);
    expect(
      screen.getAllByText(/research shows onboarding copy is unclear/i),
    ).toHaveLength(2);
    expect(screen.getAllByText('Insight').length).toBeGreaterThanOrEqual(2);
  });

  it('searches and filters entities', async () => {
    const user = userEvent.setup();

    render(<App />);

    await createEntity({
      user,
      title: 'Interview notes',
      description: 'Raw source material from customers.',
      type: 'Research',
    });
    await createEntity({
      user,
      title: 'Prioritise onboarding',
      description: 'Decision to improve onboarding clarity.',
      type: 'Decision',
    });

    await user.type(screen.getByLabelText(/^search$/i), 'prioritise');

    expect(screen.getAllByText('Prioritise onboarding')).toHaveLength(2);
    expect(screen.queryByText('Interview notes')).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText(/^search$/i));
    await user.selectOptions(screen.getAllByLabelText(/^type$/i)[1], 'decision');

    expect(screen.getAllByText('Prioritise onboarding')).toHaveLength(2);
    expect(screen.queryByText('Interview notes')).not.toBeInTheDocument();
  });

  it('edits an entity', async () => {
    const user = userEvent.setup();

    render(<App />);

    await createEntity({
      user,
      title: 'Initial title',
      description: 'Initial description',
      type: 'Opportunity',
    });

    await user.click(screen.getByRole('button', { name: /^edit$/i }));
    await user.clear(screen.getByLabelText(/^title$/i));
    await user.type(screen.getByLabelText(/^title$/i), 'Updated opportunity');
    await user.clear(screen.getByLabelText(/^description$/i));
    await user.type(
      screen.getByLabelText(/^description$/i),
      'Updated opportunity description.',
    );
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(screen.getAllByText('Updated opportunity')).toHaveLength(2);
    expect(
      screen.getAllByText(/updated opportunity description/i),
    ).toHaveLength(2);
  });

  it('deletes an entity', async () => {
    const user = userEvent.setup();

    render(<App />);

    await createEntity({
      user,
      title: 'Temporary insight',
      description: 'Short-lived note.',
      type: 'Insight',
    });

    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(screen.queryByText('Temporary insight')).not.toBeInTheDocument();
    expect(screen.getByText(/no entities yet/i)).toBeInTheDocument();
  });

  it('validates required title and description fields', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole('button', { name: /create entity/i }));

    expect(
      screen.getByText(/title and description are required/i),
    ).toBeInTheDocument();
  });

  it('creates, shows and removes a valid relationship', async () => {
    const user = userEvent.setup();

    render(<App />);

    await createEntity({
      user,
      title: 'Interview notes',
      description: 'User interview source material.',
      type: 'Research',
    });
    await createEntity({
      user,
      title: 'Users miss onboarding value',
      description: 'An interpreted research finding.',
      type: 'Insight',
    });

    await user.click(screen.getByText('Interview notes'));
    await addRelationship({
      user,
      relationship: 'produces',
      target: 'Users miss onboarding value',
    });

    expect(
      screen.getByText(
        /research produces insight: interview notes -> users miss onboarding value/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/follows from this/i)).toBeInTheDocument();

    await selectEntity(user, 'Users miss onboarding value');

    expect(
      screen.getByText(
        /research produces insight: interview notes -> users miss onboarding value/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/leads into this/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /remove/i }));

    expect(screen.queryByText(/research produces insight/i)).not.toBeInTheDocument();
    expect(screen.getByText(/no direct connections yet/i)).toBeInTheDocument();
  });

  it('filters relationship targets to valid entity types', async () => {
    const user = userEvent.setup();

    render(<App />);

    await createEntity({
      user,
      title: 'Interview notes',
      description: 'User interview source material.',
      type: 'Research',
    });
    await createEntity({
      user,
      title: 'Improve onboarding',
      description: 'Decision to improve onboarding messaging.',
      type: 'Decision',
    });

    await user.click(screen.getByText('Interview notes'));
    await openDirectConnections(user);

    const relationshipForm = screen.getByRole('form', {
      name: /connect this entity/i,
    });

    await user.selectOptions(
      within(relationshipForm).getByLabelText(/^connection type$/i),
      'produces',
    );

    expect(
      within(relationshipForm).queryByRole('option', {
        name: /improve onboarding/i,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/create an insight before this research can be connected/i),
    ).toBeInTheDocument();

    await user.click(
      within(relationshipForm).getByRole('button', {
        name: /connect entity/i,
      }),
    );

    expect(screen.getByText(/choose an entity to connect to/i)).toBeInTheDocument();
  });

  it('shows general lineage from a selected insight to downstream decisions and outcomes', async () => {
    const user = userEvent.setup();

    render(<App />);

    await createEntity({
      user,
      title: 'Users lose decision context',
      description: 'An interpreted research finding.',
      type: 'Insight',
    });
    await createEntity({
      user,
      title: 'Preserve decision rationale',
      description: 'A product opportunity.',
      type: 'Opportunity',
    });
    await createEntity({
      user,
      title: 'Decision traceability view',
      description: 'A proposed way to navigate lineage.',
      type: 'Solution',
    });
    await createEntity({
      user,
      title: 'Prototype test',
      description: 'A test of the proposed traceability view.',
      type: 'Experiment',
    });
    await createEntity({
      user,
      title: 'Build lineage navigation',
      description: 'Decision to build Phase 4 lineage navigation.',
      type: 'Decision',
    });
    await createEntity({
      user,
      title: 'Reviewers understood rationale',
      description: 'Outcome from reviewing the traceability flow.',
      type: 'Outcome',
    });

    await selectEntity(user, 'Users lose decision context');
    await addRelationship({
      user,
      relationship: 'reveals',
      target: 'Preserve decision rationale',
    });
    await selectEntity(user, 'Preserve decision rationale');
    await addRelationship({
      user,
      relationship: 'motivates',
      target: 'Decision traceability view',
    });
    await selectEntity(user, 'Decision traceability view');
    await addRelationship({
      user,
      relationship: 'validated_by',
      target: 'Prototype test',
    });
    await selectEntity(user, 'Prototype test');
    await addRelationship({
      user,
      relationship: 'informs',
      target: 'Build lineage navigation',
    });
    await selectEntity(user, 'Build lineage navigation');
    await addRelationship({
      user,
      relationship: 'influences',
      target: 'Reviewers understood rationale',
    });

    await selectEntity(user, 'Users lose decision context');

    const lineageSection = await openLineageTracker(user);

    expect(
      within(lineageSection).getByRole('button', { name: /lineage chains/i }),
    ).toBeInTheDocument();
    expect(
      within(lineageSection).getAllByText('Preserve decision rationale').length,
    ).toBeGreaterThan(0);
    expect(
      within(lineageSection).getAllByText('Decision traceability view').length,
    ).toBeGreaterThan(0);
    expect(
      within(lineageSection).getAllByText('Build lineage navigation').length,
    ).toBeGreaterThan(0);
    expect(
      within(lineageSection).getByText('Reviewers understood rationale'),
    ).toBeInTheDocument();

    await user.click(
      within(lineageSection).getByRole('button', { name: /lineage chains/i }),
    );

    expect(
      within(lineageSection).queryByText('Reviewers understood rationale'),
    ).not.toBeInTheDocument();

    await user.click(
      within(lineageSection).getByRole('button', { name: /lineage chains/i }),
    );

    expect(
      within(lineageSection).getByText('Reviewers understood rationale'),
    ).toBeInTheDocument();
  });

  it('shows empty lineage states for an entity with no lineage', async () => {
    const user = userEvent.setup();

    render(<App />);

    await createEntity({
      user,
      title: 'Standalone research',
      description: 'Research not connected to other knowledge yet.',
      type: 'Research',
    });

    const lineageSection = await openLineageTracker(user);

    expect(
      within(lineageSection).getByText(/no lineage chain is connected yet/i),
    ).toBeInTheDocument();
  });

  it('shows one complete lineage chain instead of partial subset chains', async () => {
    const user = userEvent.setup();

    render(<App />);

    await createEntity({
      user,
      title: 'Interview notes',
      description: 'Raw user interview notes.',
      type: 'Research',
    });
    await createEntity({
      user,
      title: 'Users need clearer context',
      description: 'An insight from the interviews.',
      type: 'Insight',
    });
    await createEntity({
      user,
      title: 'Preserve rationale',
      description: 'An opportunity around decision context.',
      type: 'Opportunity',
    });
    await createEntity({
      user,
      title: 'Improve decision confidence',
      description: 'A goal for the team.',
      type: 'Goal',
    });

    await selectEntity(user, 'Interview notes');
    await addRelationship({
      user,
      relationship: 'produces',
      target: 'Users need clearer context',
    });
    await selectEntity(user, 'Users need clearer context');
    await addRelationship({
      user,
      relationship: 'reveals',
      target: 'Preserve rationale',
    });
    await selectEntity(user, 'Preserve rationale');
    await addRelationship({
      user,
      relationship: 'supports',
      target: 'Improve decision confidence',
    });

    await selectEntity(user, 'Improve decision confidence');

    const lineageSection = await openLineageTracker(user);

    expect(within(lineageSection).getAllByText(/1 chain/i).length).toBeGreaterThan(0);
    expect(within(lineageSection).getByText('Interview notes')).toBeInTheDocument();
    expect(
      within(lineageSection).getByText('Users need clearer context'),
    ).toBeInTheDocument();
    expect(within(lineageSection).getByText('Preserve rationale')).toBeInTheDocument();
    expect(
      within(lineageSection).getByText('Improve decision confidence'),
    ).toBeInTheDocument();
  });

  it('keeps distinct lineage routes and supports selecting entities from chains', async () => {
    const user = userEvent.setup();

    render(<App />);

    await createEntity({
      user,
      title: 'First insight',
      description: 'One route to the opportunity.',
      type: 'Insight',
    });
    await createEntity({
      user,
      title: 'Second insight',
      description: 'Another route to the same opportunity.',
      type: 'Insight',
    });
    await createEntity({
      user,
      title: 'Shared opportunity',
      description: 'An opportunity revealed by two insights.',
      type: 'Opportunity',
    });

    await selectEntity(user, 'First insight');
    await addRelationship({
      user,
      relationship: 'reveals',
      target: 'Shared opportunity',
    });
    await selectEntity(user, 'Second insight');
    await addRelationship({
      user,
      relationship: 'reveals',
      target: 'Shared opportunity',
    });

    await selectEntity(user, 'Shared opportunity');

    const lineageSection = await openLineageTracker(user);

    expect(within(lineageSection).getAllByText(/2 chains/i).length).toBeGreaterThan(0);
    expect(within(lineageSection).getByText('First insight')).toBeInTheDocument();
    expect(within(lineageSection).getByText('Second insight')).toBeInTheDocument();

    await user.click(
      within(lineageSection).getByRole('button', { name: /insight: first insight/i }),
    );

    expect(
      screen.getByRole('heading', { name: /first insight/i }),
    ).toBeInTheDocument();
  });

  it('shows decision support and outcomes in the unified lineage tracker', async () => {
    const user = userEvent.setup();

    render(<App />);

    await createEntity({
      user,
      title: 'Interview notes',
      description: 'User interview source material.',
      type: 'Research',
    });
    await createEntity({
      user,
      title: 'Users lose decision context',
      description: 'An interpreted research finding.',
      type: 'Insight',
    });
    await createEntity({
      user,
      title: 'Preserve decision rationale',
      description: 'A product opportunity.',
      type: 'Opportunity',
    });
    await createEntity({
      user,
      title: 'Decision traceability view',
      description: 'A proposed way to navigate lineage.',
      type: 'Solution',
    });
    await createEntity({
      user,
      title: 'Prototype test',
      description: 'A test of the proposed traceability view.',
      type: 'Experiment',
    });
    await createEntity({
      user,
      title: 'Build lineage navigation',
      description: 'Decision to build Phase 4 lineage navigation.',
      type: 'Decision',
    });
    await createEntity({
      user,
      title: 'Reviewers understood rationale',
      description: 'Outcome from reviewing the traceability flow.',
      type: 'Outcome',
    });

    await selectEntity(user, 'Interview notes');
    await addRelationship({
      user,
      relationship: 'produces',
      target: 'Users lose decision context',
    });
    await selectEntity(user, 'Users lose decision context');
    await addRelationship({
      user,
      relationship: 'reveals',
      target: 'Preserve decision rationale',
    });
    await selectEntity(user, 'Preserve decision rationale');
    await addRelationship({
      user,
      relationship: 'motivates',
      target: 'Decision traceability view',
    });
    await selectEntity(user, 'Decision traceability view');
    await addRelationship({
      user,
      relationship: 'validated_by',
      target: 'Prototype test',
    });
    await selectEntity(user, 'Prototype test');
    await addRelationship({
      user,
      relationship: 'informs',
      target: 'Build lineage navigation',
    });
    await selectEntity(user, 'Build lineage navigation');
    await addRelationship({
      user,
      relationship: 'influences',
      target: 'Reviewers understood rationale',
    });

    const lineageSection = await openLineageTracker(user);

    expect(
      within(lineageSection).getByRole('button', {
        name: /lineage chains/i,
      }),
    ).toBeInTheDocument();
    expect(
      within(lineageSection).queryByRole('button', {
        name: /what led here/i,
      }),
    ).not.toBeInTheDocument();
    expect(
      within(lineageSection).queryByRole('button', {
        name: /outcomes/i,
      }),
    ).not.toBeInTheDocument();
    expect(within(lineageSection).getByText(/research:/i)).toBeInTheDocument();
    expect(
      within(lineageSection).getByText('Interview notes'),
    ).toBeInTheDocument();
    expect(
      within(lineageSection).getAllByText(/validated by/i).length,
    ).toBeGreaterThan(0);
    expect(
      within(lineageSection).getByText('Reviewers understood rationale'),
    ).toBeInTheDocument();
    expect(
      within(lineageSection).getByText(/no traceability gaps found/i),
    ).toBeInTheDocument();
  });

  it('shows decision traceability gaps in the unified lineage tracker', async () => {
    const user = userEvent.setup();

    render(<App />);

    await createEntity({
      user,
      title: 'Build lineage navigation',
      description: 'Decision to build Phase 4 lineage navigation.',
      type: 'Decision',
    });

    const lineageSection = await openLineageTracker(user);

    expect(
      within(lineageSection).getByText(
        /no lineage chain is connected yet/i,
      ),
    ).toBeInTheDocument();
    expect(
      within(lineageSection).getByText(
        /no incoming supporting lineage is connected to this decision/i,
      ),
    ).toBeInTheDocument();
    expect(
      within(lineageSection).getByText(
        /no upstream research, insight or experiment is connected to this decision/i,
      ),
    ).toBeInTheDocument();
    expect(
      within(lineageSection).getByText(
        /no downstream outcome is connected to this decision/i,
      ),
    ).toBeInTheDocument();

    await user.click(
      within(lineageSection).getByRole('button', { name: /traceability gaps/i }),
    );

    expect(
      within(lineageSection).queryByText(
        /no incoming supporting lineage is connected to this decision/i,
      ),
    ).not.toBeInTheDocument();
  });

  it('loads demo data for Phase 4 lineage validation', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole('button', { name: /load demo data/i }));

    expect(
      screen.getAllByText('Build Phase 4 lineage navigation').length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText('Pilot unsupported prioritisation view').length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText('Reviewers understood decision context').length,
    ).toBeGreaterThan(0);

    const lineageSection = await openLineageTracker(user);

    expect(
      within(lineageSection).getByText(
        'Interview notes: decision context loss',
      ),
    ).toBeInTheDocument();
    expect(
      within(lineageSection).getAllByText('Reviewers understood decision context')
        .length,
    ).toBeGreaterThan(0);
    expect(
      within(lineageSection).getByText(/no traceability gaps found/i),
    ).toBeInTheDocument();

    await selectEntity(user, 'Teams lose decision rationale');

    const insightLineageSection = await openLineageTracker(user);

    expect(
      within(insightLineageSection).getAllByText('Build Phase 4 lineage navigation')
        .length,
    ).toBeGreaterThan(0);
    expect(
      within(insightLineageSection).getByText('Reviewers understood decision context'),
    ).toBeInTheDocument();
  });

  it('shows demo traceability gaps and can reset the workspace', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole('button', { name: /load demo data/i }));
    await selectEntity(user, 'Pilot unsupported prioritisation view');

    const lineageSection = await openLineageTracker(user);

    expect(
      within(lineageSection).getByText(
        /no incoming supporting lineage is connected to this decision/i,
      ),
    ).toBeInTheDocument();
    expect(
      within(lineageSection).getByText(
        /no downstream outcome is connected to this decision/i,
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /reset workspace/i }));

    expect(
      screen.queryByText('Pilot unsupported prioritisation view'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Build Phase 4 lineage navigation')).not.toBeInTheDocument();
    expect(screen.getByText(/no entities yet/i)).toBeInTheDocument();
  });
});

async function createEntity({
  user,
  title,
  description,
  type,
}: {
  user: ReturnType<typeof userEvent.setup>;
  title: string;
  description: string;
  type: string;
}) {
  const form = screen.getByRole('form', { name: /create entity/i });

  await user.selectOptions(within(form).getByLabelText(/^type$/i), type);
  await user.type(within(form).getByLabelText(/^title$/i), title);
  await user.type(within(form).getByLabelText(/^description$/i), description);
  await user.click(within(form).getByRole('button', { name: /create entity/i }));
}

async function selectEntity(
  user: ReturnType<typeof userEvent.setup>,
  title: string,
) {
  await user.click(screen.getAllByText(title)[0]);
}

async function addRelationship({
  user,
  relationship,
  target,
}: {
  user: ReturnType<typeof userEvent.setup>;
  relationship: string;
  target: string;
}) {
  await openDirectConnections(user);

  const form = screen.getByRole('form', { name: /connect this entity/i });

  await user.selectOptions(
    within(form).getByLabelText(/^connection type$/i),
    relationship,
  );
  await user.selectOptions(within(form).getByLabelText(/^connect to$/i), target);
  await user.click(
    within(form).getByRole('button', { name: /connect entity/i }),
  );
}

async function openLineageTracker(user: ReturnType<typeof userEvent.setup>) {
  const lineageSection = screen.getByRole('region', {
    name: /lineage tracker/i,
  });
  const toggle = within(lineageSection).getByRole('button', {
    name: /lineage tracker/i,
  });

  if (toggle.getAttribute('aria-expanded') === 'false') {
    await user.click(toggle);
  }

  return lineageSection;
}

async function openDirectConnections(user: ReturnType<typeof userEvent.setup>) {
  const connectionsSection = screen.getByRole('region', {
    name: /direct connections/i,
  });
  const toggle = within(connectionsSection).getByRole('button', {
    name: /direct connections/i,
  });

  if (toggle.getAttribute('aria-expanded') === 'false') {
    await user.click(toggle);
  }

  return connectionsSection;
}
