# API Reference: Experimentation & A/B Testing

## REST Endpoints

### POST `/api/experiments/variant`
Retrieves or allocates a variant for a user.
- Body: `{ experimentKey: string, userId: string, ...context }`
- Returns: `{ variant: VariantDefinition | null, isEligible: boolean }`

### POST `/api/experiments/exposure`
Marks that a user was exposed to their assigned variant.
- Body: `{ experimentKey: string, userId: string }`

### POST `/api/experiments/conversion`
Records a conversion event for an exposed user.
- Body: `{ experimentKey: string, userId: string, metricName: string, value?: number }`

### GET `/api/experiments`
Lists all experiments and their statuses.

### GET `/api/experiments/:key/results`
Returns raw metrics report and SRM diagnostic (`RawMetricsReport`).
