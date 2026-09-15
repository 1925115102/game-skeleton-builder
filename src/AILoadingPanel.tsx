function AILoadingPanel() {
  return (
    <div
      style={{
        width: '360px',
        height: '100%',

        borderLeft:
          '1px solid #ddd',

        background:
          'white',

        boxSizing:
          'border-box',

        padding:
          '24px',

        display:
          'flex',

        flexDirection:
          'column',

        alignItems:
          'center',

        justifyContent:
          'center',

        textAlign:
          'center',
      }}
    >

      <div className="ai-spinner" />

      <div
        style={{
          marginTop:
            '18px',

          fontWeight:
            700,

          fontSize:
            '16px',
        }}
      >
        Reviewing Skeleton
      </div>


      <div
        style={{
          marginTop:
            '8px',

          fontSize:
            '13px',

          lineHeight:
            1.5,

          color:
            '#777',
        }}
      >
        AI is analyzing loops,
        progression, resources,
        system relationships,
        and scope.
      </div>

    </div>
  );
}

export default AILoadingPanel;