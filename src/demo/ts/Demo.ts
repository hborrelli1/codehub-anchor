import { TinyMCE } from 'tinymce';

import Plugin from '../../main/ts/Plugin';

declare let tinymce: TinyMCE;

Plugin();

tinymce.init({
  selector: 'textarea.tinymce',
  plugins: 'code codehub-anchor link',
  toolbar: 'codehub-anchor',
  contextmenu_never_use_native: true,
  contextmenu: 'codehub-anchor-remove codehub-anchor-edit',
  formats: {
    codehubAnchor: {
      inline: 'span',
      classes: 'anchor',
      attributes: {'data-codehub-anchor-name': '%value', id: '%value'},
      remove: 'all',
    }
  },
  content_style: 'span.anchor{border-bottom: 1px solid red;}',
});
