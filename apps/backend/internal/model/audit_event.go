package model

// AuditEventResponse is the API representation of an audit trail entry.
type AuditEventResponse struct {
	ID            int64  `json:"id"`
	ActorType     string `json:"actor_type"`
	Action        string `json:"action"`
	PreviousValue any    `json:"previous_value"`
	NewValue      any    `json:"new_value"`
	OccurredAt    int64  `json:"occurred_at"`
}
