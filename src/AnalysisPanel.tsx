import type {
  AnalysisIssue,
} from './analyzer/analyzerTypes';

import {
  issueFixMap,
  type IssueFixOption,
} from './analyzer/issueFixMap';

import './NodeInspector.css';


interface AnalysisPanelProps {
  issues: AnalysisIssue[];

  onSelectIssue: (
    issue: AnalysisIssue
  ) => void;

  onSelectFix?: (
    issue: AnalysisIssue,
    fix: IssueFixOption
  ) => void;
}


function AnalysisPanel({
  issues,
  onSelectIssue,
  onSelectFix,
}: AnalysisPanelProps) {

  const errors =
    issues.filter(
      (issue) =>
        issue.severity === 'error'
    );

  const warnings =
    issues.filter(
      (issue) =>
        issue.severity === 'warning'
    );

  const infos =
    issues.filter(
      (issue) =>
        issue.severity === 'info'
    );


  return (
    <div className="inspector">

      <h2>
        Skeleton Analysis
      </h2>


      {/* =========================================
          SUMMARY
      ========================================= */}

      <div
        style={{
          marginBottom: '24px',
          padding: '12px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          background: 'white',
        }}
      >

        <div
          style={{
            fontWeight: 700,
            marginBottom: '8px',
          }}
        >
          {issues.length === 0
            ? 'No structural issues found'
            : `${issues.length} issue${
                issues.length === 1
                  ? ''
                  : 's'
              } found`}
        </div>


        <div
          style={{
            fontSize: '13px',
            lineHeight: 1.6,
          }}
        >
          Errors: {errors.length}
          <br />

          Warnings: {warnings.length}
          <br />

          Info: {infos.length}
        </div>

      </div>


      {/* =========================================
          ISSUE LIST
      ========================================= */}

      {issues.length === 0 ? (

        <p
          style={{
            fontSize: '14px',
            lineHeight: 1.5,
          }}
        >
          The current skeleton does not
          contain any issues detected by
          the current rule set.
        </p>

      ) : (

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >

          {issues.map((issue) => {

            const fixes =
              (issueFixMap[issue.type] ?? [])
                .filter(
                  (fix) =>
                    fix.actionType ===
                    'connect_existing'
                );


            return (
              <div
                key={issue.id}

                style={{
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  background: 'white',
                }}
              >

                {/* =================================
                    ISSUE HEADER
                ================================= */}

                <div
                  onClick={() =>
                    onSelectIssue(issue)
                  }
                  style={{
                    cursor: 'pointer',
                  }}
                >

                  <div
                    style={{
                      fontWeight: 700,
                      marginBottom: '4px',
                    }}
                  >
                    {issue.severity ===
                      'error' && '⛔ '}

                    {issue.severity ===
                      'warning' && '⚠️ '}

                    {issue.severity ===
                      'info' && 'ℹ️ '}

                    {issue.title}
                  </div>


                  <div
                    style={{
                      fontSize: '13px',
                      lineHeight: 1.5,
                    }}
                  >
                    {issue.message}
                  </div>


                  <div
                    style={{
                      marginTop: '8px',
                      fontSize: '11px',
                      opacity: 0.55,
                    }}
                  >
                    {issue.type}
                  </div>

                </div>


                {/* =================================
                    SUGGESTED FIXES
                ================================= */}

                {fixes.length > 0 && (

                  <div
                    style={{
                      marginTop: '14px',
                      paddingTop: '12px',
                      borderTop:
                        '1px solid #eee',
                    }}
                  >

                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        marginBottom: '8px',
                      }}
                    >
                      Suggested Fixes
                    </div>


                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >

                      {fixes.map((fix) => (

                        <button
                          key={fix.id}

                          onClick={(event) => {

                            event.stopPropagation();

                            onSelectFix?.(
                              issue,
                              fix
                            );

                          }}

                          style={{
                            width: '100%',
                            padding: '9px 10px',
                            textAlign: 'left',

                            border:
                              '1px solid #ddd',

                            borderRadius:
                              '6px',

                            background:
                              '#fafafa',

                            cursor:
                              'pointer',
                          }}
                        >

                          <div
                            style={{
                              fontWeight:
                                600,

                              marginBottom:
                                '3px',
                            }}
                          >
                            {fix.label}
                          </div>


                          <div
                            style={{
                              fontSize:
                                '11px',

                              lineHeight:
                                1.4,

                              opacity:
                                0.7,
                            }}
                          >
                            {
                              fix.description
                            }
                          </div>


                          <div
                            style={{
                              marginTop:
                                '6px',

                              fontSize:
                                '10px',

                              opacity:
                                0.5,
                            }}
                          >
                            Scope: {
                              fix.scopeImpact
                            }
                          </div>

                        </button>

                      ))}

                    </div>

                  </div>

                )}

              </div>
            );

          })}

        </div>

      )}

    </div>
  );
}


export default AnalysisPanel;
