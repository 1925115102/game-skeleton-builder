import type {
  AIReviewResult,
  AIIssue,
  AISuggestion,
} from './ai/aiTypes';


type Props = {
  review: AIReviewResult;

  onSelectIssue: (
    issue: AIIssue
  ) => void;

  onSelectSuggestion: (
    suggestion: AISuggestion
  ) => void;

  onClose: () => void;
};


function AIAnalysisPanel({
  review,
  onSelectIssue,
  onSelectSuggestion,
  onClose,
}: Props) {

  return (
    <div
      style={{
        width: '360px',
        height: '100%',
        borderLeft:
          '1px solid #ddd',

        background: 'white',

        overflowY: 'auto',

        boxSizing:
          'border-box',

        padding: '18px',

        textAlign: 'left',
      }}
    >

      {/* =========================
          Header
      ========================= */}

      <div
        style={{
          display: 'flex',

          justifyContent:
            'space-between',

          alignItems:
            'center',

          marginBottom:
            '20px',
        }}
      >

        <div>

          <div
            style={{
              fontSize: '12px',

              fontWeight: 700,

              color: '#777',

              letterSpacing:
                '0.08em',
            }}
          >
            AI SKELETON REVIEW
          </div>

        </div>


        <button
          onClick={onClose}
          style={{
            border: 'none',

            background:
              'transparent',

            cursor:
              'pointer',

            fontSize:
              '18px',
          }}
        >
          ×
        </button>

      </div>


      {/* =========================
          Summary
      ========================= */}

      <SectionTitle>
        Summary
      </SectionTitle>

      <p
        style={{
          fontSize: '14px',

          lineHeight: 1.6,

          marginBottom:
            '24px',
        }}
      >
        {review.summary}
      </p>


      {/* =========================
          Strengths
      ========================= */}

      <SectionTitle>
        Strengths
      </SectionTitle>

      <div
        style={{
          display: 'flex',

          flexDirection:
            'column',

          gap: '10px',

          marginBottom:
            '24px',
        }}
      >

        {review.strengths.map(
          (strength) => (

            <div
              key={
                strength.id
              }
              style={{
                padding:
                  '10px 12px',

                border:
                  '1px solid #ddd',

                borderRadius:
                  '8px',
              }}
            >

              <div
                style={{
                  fontWeight:
                    600,

                  fontSize:
                    '14px',

                  marginBottom:
                    '4px',
                }}
              >
                ✓ {strength.title}
              </div>


              <div
                style={{
                  fontSize:
                    '12px',

                  lineHeight:
                    1.5,

                  color:
                    '#666',
                }}
              >
                {
                  strength.description
                }
              </div>

            </div>

          )
        )}

      </div>


      {/* =========================
          Issues
      ========================= */}

      <SectionTitle>
        Issues
      </SectionTitle>

      <div
        style={{
          display: 'flex',

          flexDirection:
            'column',

          gap: '10px',

          marginBottom:
            '24px',
        }}
      >

        {review.issues.map(
          (issue) => (

            <button
              key={issue.id}

              onClick={() =>
                onSelectIssue(
                  issue
                )
              }

              style={{
                padding:
                  '12px',

                border:
                  '1px solid #ddd',

                borderRadius:
                  '8px',

                background:
                  'white',

                textAlign:
                  'left',

                cursor:
                  'pointer',
              }}
            >

              <div
                style={{
                  display:
                    'flex',

                  justifyContent:
                    'space-between',

                  gap: '10px',

                  marginBottom:
                    '5px',
                }}
              >

                <strong
                  style={{
                    fontSize:
                      '14px',
                  }}
                >
                  ⚠ {issue.title}
                </strong>


                <SeverityBadge
                  severity={
                    issue.severity
                  }
                />

              </div>


              <div
                style={{
                  fontSize:
                    '12px',

                  lineHeight:
                    1.5,

                  color:
                    '#666',
                }}
              >
                {
                  issue.description
                }
              </div>

            </button>

          )
        )}

      </div>


      {/* =========================
          Suggestions
      ========================= */}

      <SectionTitle>
        Suggestions
      </SectionTitle>

      <div
        style={{
          display: 'flex',

          flexDirection:
            'column',

          gap: '10px',
        }}
      >

        {review.suggestions.map(
          (suggestion) => (

            <button
              key={
                suggestion.id
              }

              onClick={() =>
                onSelectSuggestion(
                  suggestion
                )
              }

              style={{
                padding:
                  '12px',

                border:
                  '1px solid #ddd',

                borderRadius:
                  '8px',

                background:
                  'white',

                textAlign:
                  'left',

                cursor:
                  'pointer',
              }}
            >

              <div
                style={{
                  fontWeight:
                    600,

                  fontSize:
                    '14px',

                  marginBottom:
                    '5px',
                }}
              >
                → {
                  suggestion.title
                }
              </div>


              <div
                style={{
                  fontSize:
                    '12px',

                  lineHeight:
                    1.5,

                  color:
                    '#666',

                  marginBottom:
                    '8px',
                }}
              >
                {
                  suggestion.description
                }
              </div>


              <div
                style={{
                  display:
                    'flex',

                  gap: '6px',

                  flexWrap:
                    'wrap',
                }}
              >

                <SmallBadge>
                  {
                    suggestion.category
                  }
                </SmallBadge>

                <SmallBadge>
                  Scope: {
                    suggestion.scopeImpact
                  }
                </SmallBadge>

              </div>

            </button>

          )
        )}

      </div>

    </div>
  );
}


function SectionTitle({
  children,
}: {
  children:
    React.ReactNode;
}) {

  return (
    <div
      style={{
        fontSize: '12px',

        fontWeight: 700,

        textTransform:
          'uppercase',

        letterSpacing:
          '0.08em',

        marginBottom:
          '10px',
      }}
    >
      {children}
    </div>
  );
}


function SeverityBadge({
  severity,
}: {
  severity:
    'low'
    | 'medium'
    | 'high';
}) {

  return (
    <span
      style={{
        fontSize: '10px',

        padding:
          '2px 6px',

        borderRadius:
          '999px',

        border:
          '1px solid #ccc',

        textTransform:
          'uppercase',

        whiteSpace:
          'nowrap',
      }}
    >
      {severity}
    </span>
  );
}


function SmallBadge({
  children,
}: {
  children:
    React.ReactNode;
}) {

  return (
    <span
      style={{
        fontSize: '10px',

        padding:
          '3px 6px',

        borderRadius:
          '6px',

        background:
          '#f2f2f2',

        color:
          '#555',
      }}
    >
      {children}
    </span>
  );
}


export default AIAnalysisPanel;