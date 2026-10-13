/** Keep the homepage's authored dark palette intact in the existing DarkReader theme.
 * DarkReader's supported fixes CSS is scoped to this page; tool themes are unaffected.
 */
export const neuralThemeFixes = {
  invert: [],
  ignoreInlineStyle: [],
  ignoreImageAnalysis: [],
  disableStyleSheetsProxy: false,
  css: `
    body.dark-mode [data-neural-homepage] {
      background: #080b14 !important;
      --darkreader-bg--nc-bg: #080b14 !important;
      --darkreader-bg--nc-surface: #101522 !important;
      --darkreader-text--nc-text: #edf2ff !important;
      --darkreader-text--nc-muted: #99a7bf !important;
      --darkreader-text--nc-accent: #75dbea !important;
      --darkreader-border--nc-line: rgba(157,177,225,.15) !important;
      --darkreader-bg--nc-line: rgba(157,177,225,.15) !important;
    }
    body.dark-mode [data-neural-homepage] header::before {
      background-color: transparent !important;
    }
    body.dark-mode [data-neural-primary] {
      background: #b8eff5 !important;
      color: #102231 !important;
      border-color: #d5faff !important;
    }
    body.dark-mode [data-neural-title] {
      background-image: linear-gradient(100deg, #a4eff7, #85aff9 55%, #ba9cff) !important;
    }
  `,
};
