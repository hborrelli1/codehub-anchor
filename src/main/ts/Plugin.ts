import { Editor, TinyMCE } from 'tinymce';

declare const tinymce: TinyMCE;

const setup = (editor: Editor): void => {
  let generatedUrl: string;

  const convertTextToValidSelector = (name) => {
    return name.toLowerCase().replace(/\W/g, '-');
  }

  const formatId = (value) => {
    const name = tinymce.trim(value);
    return convertTextToValidSelector(name);
  }

  const createUrl = (id) => {
    const editPagesRegex = /(\/edit)|(\/tinyEdit)/g;
    const href = window.location.href.replace(editPagesRegex, '');
    let anchor = '&anchor=' + id;
    if (href.indexOf('#') < 0) {
      const selectedNode = sessionStorage.getItem('selected-node') || '';
      anchor = '#' + selectedNode + anchor;
    }
    return href + anchor;
  }

  // Custom event handler for the 'copy' event.
  const copyHandler = (e) => {
    e.preventDefault();
    console.log('autoCopy...');
    console.log('e: ', e);

    /**
     * This is where i'm having issues. 
     * This works to copy the contents of the dialog input. 
     * However, it breaks the copying functionality inside the editor. 
     * What is the best way to acheive both of these scenarios - fixing normal copy/paste functionality within the editor
     * While also enabling this custom copy method to grab the value from the anchor_link dialog input and copy to the clipboard?
     */

    editor.execCommand('copy');
    if (generatedUrl) {
      e.clipboardData.setData('text/plain', generatedUrl);
    }
    
  }
  
  // Generate available context menu item.
  const generateContextItem = (element: any, selection: string, menuItem: string) => {
    
    // Only display context menu item if selection has anchor formatting and is not empty.
    if (element.nodeName === 'SPAN' && element.getAttribute('data-codehub-anchor-name') && selection) {
      return menuItem;
    } else {
      return '';
    }
  }

  const openDialog = (selectedContent: string, codehubAnchorAttribute: string) => {
    // Initial Dialog definition
    return editor.windowManager.open({
      title: 'Insert Anchor',
      body: {
        type: 'panel',
        items: [
          {
            type: 'input',
            name: 'anchor_name',
            label: 'Anchor Name',
            inputMode: 'text',
          },
          {
            type: 'input',
            name: 'anchor_link',
            label: 'Anchor Link',
            inputMode: 'text',
          },
        ]
      },
      initialData: {
        'anchor_name': codehubAnchorAttribute ? codehubAnchorAttribute : '',
        'anchor_link': '',
      },
      buttons: [
        {
          type: 'custom', 
          name: 'removeAnchorFormatting', 
          text: 'Remove Anchor',
          disabled: codehubAnchorAttribute ? false : true,
        },
        {
          type: 'custom',
          name: 'generateUrl',
          text: 'Generate URL',
          disabled: codehubAnchorAttribute ? false : true,
        }
      ],
      // Fires when input changes.
      onChange: (api, details) => {
        // Only enable the Generate Button if there is text in the input.
        const value = api.getData()['anchor_name'];
        if (value !== '') {
          api.enable('generateUrl');
          const formattedValue = formatId(value)
          const href = createUrl(formattedValue);
          generatedUrl = href;
          api.setData({'anchor_link': generatedUrl})
        } else {
          api.disable('generateUrl');
        }
      },
      // Fires when 'generateUrl' button is clicked.
      onAction: (api, details) => {
        // // Get the value from the anchor name input and generate the url
        const id = api.getData()['anchor_name'];
        
        // If remove format button is clicked.
        if (details.name === 'removeAnchorFormatting') {
          editor.formatter.remove('codehubAnchor');
          api.close();
        } else {
          if (selectedContent.trim() && selectedContent.trim().length > 0) {
            // Apply custom format defined in the editor component.
            editor.formatter.apply('codehubAnchor', { value: formatId(id)});
          } else {
            alert('Selection cannot be empty...')
          }
          
          // Copy href to clipboard.
          api.focus('anchor_link');
          editor.execCommand('copy');
          
          // Provide new Dialog content.
          api.redial({
            title: 'Anchor Generated',
            body: {
              type: 'panel',
              items: [
                {
                  type: 'alertbanner',
                  text: 'The generated URL has been copied to your clipboard.',
                  level: 'success',
                  icon: 'close',
                },
              ]
            },
            buttons: [
              {
                type: 'cancel',
                text: 'Close',
              }
            ],
            onAction: (api) => {
              api.close();
            }
          });
  
          // Close window after set amount of time.
          setTimeout(() => {
            api.close();
          }, 5000);
        }
      },
    })
  }

  // Add plugin button.
  editor.ui.registry.addToggleButton('codehub-anchor', {
    icon: 'anchor-icon',
    tooltip: 'Insert Anchor',
    
    // Fires when plugin button is clicked.
    onAction: () => {
      const selection = editor.selection;
      const selectedContent = selection.getContent();
      const selectedNode = selection.getNode();
      const codehubAnchorAttribute = editor.dom.getAttrib(selectedNode, 'data-codehub-anchor-name', null);
      
      // If selection is not empty open dialog.
      if (selectedContent.trim() && selectedContent.trim().length > 0) {
        // Open dialog window.
        openDialog(selectedContent, codehubAnchorAttribute);
      } else {
        alert('Selection cannot be empty.');
      }
    },

    // Bind event listeners on setup.
    onSetup: (api) => {
      editor.on('copy', copyHandler);
      editor.formatter.formatChanged('codehubAnchor', (state) => {
        api.setActive(state);
      }, true);

      // Tear down method to remove event listeners - Required by tinymce.
      return () => {
        editor.off('copy', copyHandler);
      }
    }
  });

  // Registers Menu Items - required for context menu.
  editor.ui.registry.addMenuItem('codehub-anchor-remove', {
    icon: 'remove-anchor-icon',
    text: 'Remove Codehub Anchor',

    // Fires when context menu button is clicked.
    onAction: () => {
      // Remove codehub anchor formatting.
      editor.formatter.remove('codehubAnchor');
    }
  });

  editor.ui.registry.addMenuItem('codehub-anchor-edit', {
    icon: 'anchor-icon',
    text: 'Edit Codehub Anchor',

    // Fires when context menu button is clicked.
    onAction: () => {
      // const selection = editor.selection;
      const selectedContent = editor.selection.getContent();
      const selectedNode = editor.selection.getNode();
      const codehubAnchorAttribute = editor.dom.getAttrib(selectedNode, 'data-codehub-anchor-name', null);

      // Apply existing anchor id to edit dialog window.
      openDialog(selectedContent, codehubAnchorAttribute);
    }
  });

  // Defines context menu items for codehub anchor (right click).
  editor.ui.registry.addContextMenu('codehub-anchor-remove', {
    update: (element) => {
      const selection = editor.selection.getContent();

      // Only display context menu item if selection has anchor formatting and is not empty.
      return generateContextItem(element, selection, 'codehub-anchor-remove');
    }
  });

  editor.ui.registry.addContextMenu('codehub-anchor-edit', {
    update: (element) => {
      const selection = editor.selection.getContent();

      // Only display context menu item if selection has anchor formatting and is not empty.
      return generateContextItem(element, selection, 'codehub-anchor-edit');
    }
  });
};

export default (): void => {
  tinymce.PluginManager.add('codehub-anchor', setup);
};
