// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Papilio Works Docs',
  tagline: 'FPGA retro gaming — documentation and guides',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://papilioworks.com',
  baseUrl: '/docs/',

  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          routeBasePath: '/',
          editUrl: 'https://github.com/Papilio-Retrocade/papilioworks.com/tree/main/docs-src/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'Papilio Works',
        logo: {
          alt: 'Papilio Works',
          src: 'img/logo.svg',
          href: 'https://papilioworks.com',
          target: '_self',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'mainSidebar',
            position: 'left',
            label: 'Docs',
          },
          {
            href: 'https://papilioworks.com',
            label: 'Back to papilioworks.com',
            position: 'right',
          },
          {
            href: 'https://github.com/Papilio-Retrocade',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Getting Started',
            items: [
              { label: "What's in the Box", to: '/getting-started' },
              { label: 'Flash Firmware', to: '/getting-started/flash-firmware' },
              { label: 'Load a Core', to: '/getting-started/load-a-core' },
              { label: 'SD Card Setup', to: '/getting-started/sd-card-setup' },
              { label: 'Pair Your Controller', to: '/getting-started/pair-your-controller' },
            ],
          },
          {
            title: 'Community',
            items: [
              { label: 'community.papilioworks.com', href: 'https://community.papilioworks.com' },
              { label: 'GitHub', href: 'https://github.com/Papilio-Retrocade' },
            ],
          },
          {
            title: 'Papilio Works',
            items: [
              { label: 'papilioworks.com', href: 'https://papilioworks.com' },
              { label: 'About', to: '/about/papilio-works' },
              { label: 'Roadmap', to: '/about/roadmap' },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Papilio Works`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
