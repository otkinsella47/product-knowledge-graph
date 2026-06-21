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

    await user.click(screen.getByText('Users miss onboarding value'));

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
