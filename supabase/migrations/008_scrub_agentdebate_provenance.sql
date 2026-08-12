-- Remove the legacy `agentdebate` provenance pack from imported SMEs. Its one
-- content field, institutional_incentives, is promoted to a first-class
-- attribute; the rest (domain, is_ai_generated) was redundant provenance and is
-- dropped. Idempotent — only touches rows that still carry the pack.
update smes
set
  attributes = case
    when extensions -> 'agentdebate' ? 'institutional_incentives'
      then jsonb_set(
        coalesce(attributes, '{}'::jsonb),
        '{institutional_incentives}',
        extensions -> 'agentdebate' -> 'institutional_incentives'
      )
    else attributes
  end,
  extensions = extensions - 'agentdebate',
  updated_at = now()
where extensions ? 'agentdebate';
