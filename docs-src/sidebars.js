// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  mainSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsible: false,
      items: [
        'getting-started/index',
        'getting-started/flash-firmware',
        'getting-started/load-a-core',
        'getting-started/sd-card-setup',
        'getting-started/pair-your-controller',
      ],
    },
    {
      type: 'category',
      label: 'Cores',
      items: [
        'cores/atari-2600',
        'cores/commodore-64',
        'cores/snes',
        'cores/nes',
        'cores/compatibility',
      ],
    },
    {
      type: 'category',
      label: 'Troubleshooting',
      items: [
        'troubleshooting/faq',
        'troubleshooting/synthesis-errors',
        'troubleshooting/common-issues',
      ],
    },
    {
      type: 'category',
      label: 'Hardware',
      items: [
        'hardware/overview',
        'hardware/retrocade-board',
        'hardware/tang-primer-20k',
        'hardware/esp32-s3-supermini',
      ],
    },
    {
      type: 'category',
      label: 'Advanced',
      items: [
        'advanced/contributing-cores',
        'advanced/wishbone-overview',
        'advanced/ai-fpga-development',
      ],
    },
    {
      type: 'category',
      label: 'About',
      items: [
        'about/papilio-works',
        'about/roadmap',
        'about/community',
      ],
    },
  ],

  // But you can create a sidebar manually
  /*
  tutorialSidebar: [
    'intro',
    'hello',
    {
      type: 'category',
      label: 'Tutorial',
      items: ['tutorial-basics/create-a-document'],
    },
  ],
   */
};

export default sidebars;
