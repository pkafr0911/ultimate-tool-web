export const SAMPLE_DIAGRAMS: Record<string, { label: string; icon: string; code: string }> = {
  flowchart: {
    label: 'Flowchart',
    icon: '📊',
    code: `flowchart TD
    A[Christmas] -->|Get money| B(Go shopping)
    B --> C{Let me think}
    C -->|One| D[Laptop]
    C -->|Two| E[iPhone]
    C -->|Three| F[fa:fa-car Car]`,
  },
  sequence: {
    label: 'Sequence',
    icon: '🔄',
    code: `sequenceDiagram
    Alice->>+John: Hello John, how are you?
    Alice->>+John: John, can you hear me?
    John-->>-Alice: Hi Alice, I can hear you!
    John-->>-Alice: I feel great!`,
  },
  classDiagram: {
    label: 'Class',
    icon: '🏗️',
    code: `classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Animal: +mate()
    class Duck{
        +String beakColor
        +swim()
        +quack()
    }
    class Fish{
        -int sizeInFeet
        -canEat()
    }
    class Zebra{
        +bool is_wild
        +run()
    }`,
  },
  stateDiagram: {
    label: 'State',
    icon: '🔲',
    code: `stateDiagram-v2
    [*] --> Still
    Still --> [*]

    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`,
  },
  erDiagram: {
    label: 'Entity Relationship',
    icon: '🗃️',
    code: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses`,
  },
  gantt: {
    label: 'Gantt',
    icon: '📅',
    code: `gantt
    title A Gantt Diagram
    dateFormat YYYY-MM-DD
    section Section
        A task          :a1, 2024-01-01, 30d
        Another task    :after a1, 20d
    section Another
        Task in Another :2024-01-12, 12d
        another task    :24d`,
  },
  pie: {
    label: 'Pie',
    icon: '🥧',
    code: `pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15`,
  },
  gitGraph: {
    label: 'Git',
    icon: '🌿',
    code: `gitGraph
    commit
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
    commit
    commit`,
  },
  mindmap: {
    label: 'Mindmap',
    icon: '🧠',
    code: `mindmap
  root((mindmap))
    Origins
      Long history
      ::icon(fa fa-book)
      Popularisation
        British popular psychology author Tony Buzan
    Research
      On effectiveness<br/>and features
      On Automatic creation
        Uses
            Creative techniques
            Strategic planning
            Argument mapping
    Tools
      Pen and paper
      Mermaid`,
  },
  timeline: {
    label: 'Timeline',
    icon: '⏳',
    code: `timeline
    title History of Social Media Platform
    2002 : LinkedIn
    2004 : Facebook
         : Google
    2005 : YouTube
    2006 : Twitter`,
  },
  quadrant: {
    label: 'Quadrant',
    icon: '📐',
    code: `quadrantChart
    title Reach and engagement of campaigns
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    quadrant-1 We should expand
    quadrant-2 Need to promote
    quadrant-3 Re-evaluate
    quadrant-4 May be improved
    Campaign A: [0.3, 0.6]
    Campaign B: [0.45, 0.23]
    Campaign C: [0.57, 0.69]
    Campaign D: [0.78, 0.34]
    Campaign E: [0.40, 0.34]
    Campaign F: [0.35, 0.78]`,
  },
  sankey: {
    label: 'Sankey',
    icon: '🌊',
    code: `sankey-beta

Agricultural 'waste',Bio-energy,124.729
Bio-energy,Electricity grid,29.544
Bio-energy,Losses,6.242
Bio-energy,Industry,10.544
Coal imports,Coal,135.835
Coal reserves,Coal,35.000
Coal,Electricity grid,35.999
Coal,Industry,11.606
Coal,Losses,51.230`,
  },
  xychart: {
    label: 'XY Chart',
    icon: '📈',
    code: `xychart-beta
    title "Sales Revenue"
    x-axis [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
    y-axis "Revenue (in $)" 4000 --> 11000
    bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
    line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]`,
  },
  block: {
    label: 'Block',
    icon: '🧱',
    code: `block-beta
columns 1
  db(("DB"))
  blockArrowId6<["&nbsp;&nbsp;&nbsp;"]>(down)
  block:ID
    A
    B["A wide one in the middle"]
    C
  end
  space
  D
  ID --> D
  C --> D
  style B fill:#969,stroke:#333,stroke-width:4px`,
  },
  journey: {
    label: 'User Journey',
    icon: '🚶',
    code: `journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 5: Me`,
  },
  requirement: {
    label: 'Requirement',
    icon: '📋',
    code: `requirementDiagram

    requirement test_req {
    id: 1
    text: the test text.
    risk: high
    verifymethod: test
    }

    element test_entity {
    type: simulation
    }

    test_entity - satisfies -> test_req`,
  },
  c4: {
    label: 'C4',
    icon: '🏢',
    code: `C4Context
      title System Context diagram for Internet Banking System
      Enterprise_Boundary(b0, "BankBoundary0") {
        Person(customerA, "Banking Customer A", "A customer of the bank, with personal bank accounts.")
        System(SystemAA, "Internet Banking System", "Allows customers to view information about their bank accounts, and make payments.")

        Enterprise_Boundary(b1, "BankBoundary") {
          SystemDb_Ext(SystemE, "Mainframe Banking System", "Stores all of the core banking information about customers, accounts, transactions, etc.")
          System_Boundary(b2, "BankBoundary2") {
            System(SystemA, "Banking System A")
          }
        }
      }

      BiRel(customerA, SystemAA, "Uses")
      Rel(SystemAA, SystemE, "Uses")
      Rel(SystemAA, SystemA, "Uses")

      UpdateRelStyle(customerA, SystemAA, $offsetY="10")`,
  },
  kanban: {
    label: 'Kanban',
    icon: '📌',
    code: `kanban
  Todo
    id1[Design new feature]
    id2[Write documentation]
  "In Progress"
    id3[Implement login]@{ assigned: 'knsv' }
  Done
    id4[Setup CI/CD]
    id5[Create test cases]`,
  },
};

export const DEFAULT_CODE = SAMPLE_DIAGRAMS.flowchart.code;

export const DEFAULT_CONFIG = `{
  "theme": "default"
}`;
