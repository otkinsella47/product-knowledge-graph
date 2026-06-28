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
    expect(screen.getByText(/outgoing link/i)).toBeInTheDocument();

    await selectEntity(user, 'Users miss onboarding value');

    expect(
      screen.getByText(
        /research produces insight: interview notes -> users miss onboarding value/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/incoming link/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /remove/i }));

    expect(screen.queryByText(/research produces insight/i)).not.toBeInTheDocument();
    expect(screen.getByText(/no relationships yet/i)).toBeInTheDocument();
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

    const relationshipForm = screen.getByRole('form', {
      name: /add relationship/i,
    });

    await user.selectOptions(
      within(relationshipForm).getByLabelText(/^relationship$/i),
      'produces',
    );

    expect(
      within(relationshipForm).queryByRole('option', {
        name: /improve onboarding/i,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/create a insight entity before adding this relationship/i),
    ).toBeInTheDocument();

    await user.click(
      within(relationshipForm).getByRole('button', {
        name: /add relationship/i,
      }),
    );

    expect(screen.getByText(/choose a target entity/i)).toBeInTheDocument();
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

    const lineageSection = screen.getByRole('region', { name: /^lineage$/i });

    expect(
      within(lineageSection).getByRole('heading', { name: /what led here/i }),
    ).toBeInTheDocument();
    expect(
      within(lineageSection).getByRole('heading', { name: /what followed/i }),
    ).toBeInTheDocument();
    expect(
      within(lineageSection).getByText(/no upstream lineage is connected yet/i),
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

    const lineageSection = screen.getByRole('region', { name: /^lineage$/i });

    expect(
      within(lineageSection).getByText(/no upstream lineage is connected yet/i),
    ).toBeInTheDocument();
    expect(
      within(lineageSection).getByText(/no downstream lineage is connected yet/i),
    ).toBeInTheDocument();
  });

  it('shows decision traceability for a selected decision', async () => {
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

    const traceabilitySection = screen.getByRole('region', {
      name: /decision traceability/i,
    });

    expect(
      within(traceabilitySection).getByRole('heading', {
        name: /supporting lineage/i,
      }),
    ).toBeInTheDocument();
    expect(
      within(traceabilitySection).getByRole('heading', {
        name: /downstream outcomes/i,
      }),
    ).toBeInTheDocument();
    expect(within(traceabilitySection).getByText(/research:/i)).toBeInTheDocument();
    expect(
      within(traceabilitySection).getByText('Interview notes'),
    ).toBeInTheDocument();
    expect(
      within(traceabilitySection).getAllByText(/validated by/i).length,
    ).toBeGreaterThan(0);
    expect(
      within(traceabilitySection).getByText('Reviewers understood rationale'),
    ).toBeInTheDocument();
    expect(
      within(traceabilitySection).getByText(/no lineage gaps found/i),
    ).toBeInTheDocument();
  });

  it('shows decision traceability gaps for a decision with missing connections', async () => {
    const user = userEvent.setup();

    render(<App />);

    await createEntity({
      user,
      title: 'Build lineage navigation',
      description: 'Decision to build Phase 4 lineage navigation.',
      type: 'Decision',
    });

    const traceabilitySection = screen.getByRole('region', {
      name: /decision traceability/i,
    });

    expect(
      within(traceabilitySection).getByText(
        /no supporting lineage is connected yet/i,
      ),
    ).toBeInTheDocument();
    expect(
      within(traceabilitySection).getByText(
        /no downstream outcomes are connected yet/i,
      ),
    ).toBeInTheDocument();
    expect(
      within(traceabilitySection).getByText(
        /no incoming supporting lineage is connected to this decision/i,
      ),
    ).toBeInTheDocument();
    expect(
      within(traceabilitySection).getByText(
        /no upstream research, insight or experiment is connected to this decision/i,
      ),
    ).toBeInTheDocument();
    expect(
      within(traceabilitySection).getByText(
        /no downstream outcome is connected to this decision/i,
      ),
    ).toBeInTheDocument();
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
  const form = screen.getByRole('form', { name: /add relationship/i });

  await user.selectOptions(
    within(form).getByLabelText(/^relationship$/i),
    relationship,
  );
  await user.selectOptions(within(form).getByLabelText(/^target entity$/i), target);
  await user.click(
    within(form).getByRole('button', { name: /add relationship/i }),
  );
}
