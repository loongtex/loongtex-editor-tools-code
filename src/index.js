/**
 * Build styles
 */
import './index.css';
import { getLineStartPosition } from './utils/string';
import { IconBrackets } from '@codexteam/icons';

/**
 * CodeTool for Editor.js
 *
 * @author CodeX (team@ifmo.su)
 * @copyright CodeX 2018
 * @license MIT
 * @version 2.0.0
 */

/* global PasteEvent */

/**
 * Code Tool for the Editor.js allows to include code examples in your articles.
 */
export default class CodeTool {
  /**
   * Notify core that read-only mode is supported
   *
   * @returns {boolean}
   */
  static get isReadOnlySupported() {
    return true;
  }

  /**
   * Allow to press Enter inside the CodeTool div
   *
   * @returns {boolean}
   * @public
   */
  static get enableLineBreaks() {
    return true;
  }

  /**
   * @typedef {object} CodeData — plugin saved data
   * @property {string} code - previously saved plugin code
   */

  /**
   * Render plugin`s main Element and fill it with saved data
   *
   * @param {object} options - tool constricting options
   * @param {CodeData} options.data — previously saved plugin code
   * @param {object} options.config - user config for Tool
   * @param {object} options.api - Editor.js API
   * @param {boolean} options.readOnly - read only mode flag
   */
  constructor({ data, config, api, readOnly }) {
    console.log(data)
    this.api = api;
    this.readOnly = readOnly;

    this.placeholder = this.api.i18n.t(config.placeholder || CodeTool.DEFAULT_PLACEHOLDER);

    this.CSS = {
      baseClass: this.api.styles.block,
      input: this.api.styles.input,
      wrapper: 'ce-code',
      div: 'ce-code__inside',
      svgWrapper: 'ce-code-svg-wrapper',
    };

    this.nodes = {
      holder: null,
      div: null,
    };

    this.data = {
      code: data.code || '',
    };

    this.range = null;
    this.selection = null;
    this.isEnterPress = false;

    this.nodes.holder = this.drawView();
  }

  /**
   * Create Tool's view
   *
   * @returns {HTMLElement}
   * @private
   */
  drawView() {
    const SVG_NS = "http://www.w3.org/2000/svg";
    const wrapper = document.createElement('div'),
      inside = document.createElement('div'),
      outside = document.createElement('div'),
      svg = document.createElementNS(SVG_NS, "svg"),
      path = document.createElementNS(SVG_NS, "path"),
      svgWrapper = document.createElement('div'),
      span = document.createElement('span');

    wrapper.style.position = "relative";

    wrapper.classList.add(this.CSS.baseClass, this.CSS.wrapper);
    inside.classList.add(this.CSS.div, this.CSS.input);
    outside.classList.add("ce-code__outside");

    svgWrapper.classList.add(this.CSS.svgWrapper);

    inside.setAttribute("contenteditable", "true");
    inside.setAttribute("spellcheck", false)
    inside.setAttribute("data-placeholder", this.placeholder);
    path.setAttribute("d", "M11.804,1.33469C11.7321,0.588495,11.0987,0,10.3344,0L3.69087,0L3.54921,0.00679126C2.80302,0.0786704,2.21452,0.71212,2.21452,1.47635L2.214,2.217L1.47635,2.21725L1.33469,2.22404C0.588495,2.29592,0,2.92937,0,3.6936L0,10.3372L0.00679126,10.4788C0.0786704,11.225,0.71212,11.8135,1.47635,11.8135L8.11991,11.8135L8.26156,11.8067C9.00776,11.7348,9.59626,11.1014,9.59626,10.3372L9.596,9.596L10.3344,9.59626L10.4761,9.58946C11.2223,9.51758,11.8108,8.88414,11.8108,8.11991L11.8108,1.47635L11.804,1.33469ZM10.3343,0.959595L3.6907,0.959595C3.43233,0.959595,3.21088,1.15152,3.18136,1.40988L3.17397,1.47632L3.17383,2.21697L8.11974,2.21722C8.88396,2.21722,9.51741,2.80572,9.58929,3.55191L9.59608,3.69357L9.59583,8.63597L10.3343,8.6366C10.5926,8.6366,10.8141,8.44467,10.8436,8.18631L10.851,8.11988L10.851,1.47632C10.851,1.21796,10.6591,0.996503,10.4007,0.966976L10.3343,0.959595ZM8.11975,3.17688L1.47619,3.17688C1.21783,3.17688,0.996381,3.3688,0.966854,3.62717L0.959473,3.6936L0.959473,10.3372C0.959473,10.5955,1.1514,10.817,1.40976,10.8465L1.47619,10.8539L8.11975,10.8539C8.37812,10.8539,8.59957,10.662,8.6291,10.4036L8.63648,10.3372L8.63648,3.6936C8.63648,3.43524,8.44455,3.21379,8.18619,3.18426L8.11975,3.17688Z");
    path.setAttribute("fill", "595959");
    path.setAttribute("fill-rule", "evenodd");
    svg.setAttribute("width", 12);
    svg.setAttribute("height", 12);
    svg.setAttribute("viewBox", "0 0 12 12");

    inside.textContent = this.data.code;
    span.textContent = 'Copy';

    wrapper.addEventListener("mouseenter", () => {
      if (svgWrapper.style.opacity === '0' || !svgWrapper.style.opacity) {
        svgWrapper.style.opacity = '1';
      }
    })

    wrapper.addEventListener("mouseleave", () => {
      if (svgWrapper.style.opacity === '1') {
        svgWrapper.style.opacity = '0';
      }
    })

    svgWrapper.addEventListener("mouseenter", () => {
      svgWrapper.classList.add('active');

    })

    svgWrapper.addEventListener("mouseleave", () => {
      svgWrapper.classList.remove('active');
    })

    svgWrapper.addEventListener("click", () => {
      const oInput = document.createElement('input');
      oInput.value = inside.textContent;
      document.body.appendChild(oInput);
      oInput.select();
      document.execCommand("Copy");
      oInput.className = 'oInput';
      oInput.style.display = 'none';
      svgWrapper.removeChild(span);
      span.textContent = 'Copied';
      svgWrapper.appendChild(span);
    })

    if (this.readOnly) {
      inside.setAttribute("contenteditable", false);
    }
    svg.appendChild(path);
    svgWrapper.appendChild(svg);
    svgWrapper.appendChild(span);
    outside.appendChild(inside);
    wrapper.appendChild(outside);
    wrapper.appendChild(svgWrapper);
    inside.addEventListener("paste", (event) => {
      this.pasteHandler(event);
      this.data = {
        code: this.nodes.div.textContent,
      }
    });
    inside.addEventListener("input", () => {
      this.cursorHandler();
      this.isEnterPress = false;
    })

    inside.addEventListener("keydown", (event) => {
      this.cursorHandler();
      if (event.code.toLocaleLowerCase() === 'enter') {
        this.keyPressHandler(event);
      }else{
        this.isEnterPress = false;
      }
    })
    /**
     * Enable keydown handlers
     */
    // inside.addEventListener('keydown', (event) => {
    //   switch (event.code) {
    //     case 'Tab':
    //       this.tabHandler(event);
    //       break;
    //   }
    // });

    this.nodes.div = inside;

    return wrapper;
  }

  /**
   * Return Tool's view
   *
   * @returns {HTMLDivElement} this.nodes.holder - Code's wrapper
   * @public
   */
  render() {
    return this.nodes.holder;
  }

  /**
   * Extract Tool's data from the view
   *
   * @param {HTMLDivElement} codeWrapper - CodeTool's wrapper, containing div with code
   * @returns {CodeData} - saved plugin code
   * @public
   */
  save(codeWrapper) {
    return {
      code: codeWrapper.querySelector('.ce-code__inside').textContent,
    };
  }

  /**
   * Returns Tool`s data from private property
   *
   * @returns {CodeData}
   */
  get data() {
    return this._data;
  }

  /**
   * Set Tool`s data to private property and update view
   *
   * @param {CodeData} data - saved tool data
   */
  set data(data) {
    this._data = data;

    if (this.nodes.div) {
      this.nodes.div.textContent = data.code;
    }
  }

  /**
   * Get Tool toolbox settings
   * icon - Tool icon's SVG
   * title - title to show in toolbox
   *
   * @returns {{icon: string, title: string}}
   */
  static get toolbox() {
    return {
      icon: IconBrackets,
      title: 'Code',
    };
  }

  /**
   * Default placeholder for CodeTool's div
   *
   * @public
   * @returns {string}
   */
  static get DEFAULT_PLACEHOLDER() {
    return 'Enter a code';
  }

  /**
   *  Used by Editor.js paste handling API.
   *  Provides configuration to handle CODE tag.
   *
   * @static
   * @returns {{tags: string[]}}
   */
  static get pasteConfig() {
    return {
      tags: ['pre'],
    };
  }

  /**
   * Automatic sanitize config
   *
   * @returns {{code: boolean}}
   */
  static get sanitize() {
    return {
      code: true, // Allow HTML tags
    };
  }

  /**
   * Handles Tab key pressing (adds/removes indentations)
   *
   * @private
   * @param {KeyboardEvent} event - keydown
   * @returns {void}
   */
  tabHandler(event) {
    /**
     * Prevent editor.js tab handler
     */
    event.stopPropagation();

    /**
     * Prevent native tab behaviour
     */
    event.preventDefault();

    const div = event.target;
    const isShiftPressed = event.shiftKey;
    const caretPosition = div.selectionStart;
    const value = div.textContent;
    const indentation = '  ';

    let newCaretPosition;

    /**
     * For Tab pressing, just add an indentation to the caret position
     */
    if (!isShiftPressed) {
      newCaretPosition = caretPosition + indentation.length;

      div.textContent = value.substring(0, caretPosition) + indentation + value.substring(caretPosition);
    } else {
      /**
       * For Shift+Tab pressing, remove an indentation from the start of line
       */
      const currentLineStart = getLineStartPosition(value, caretPosition);
      const firstLineChars = value.substr(currentLineStart, indentation.length);

      if (firstLineChars !== indentation) {
        return;
      }

      /**
       * Trim the first two chars from the start of line
       */
      div.textContent = value.substring(0, currentLineStart) + value.substring(currentLineStart + indentation.length);
      newCaretPosition = caretPosition - indentation.length;
    }

    /**
     * Restore the caret
     */
    div.setSelectionRange(newCaretPosition, newCaretPosition);
  }
  /**
 * 复制粘贴处理
 * @param e
 */
  textInit(event, value) {
    const selection = this.selection;
    const range = this.range;
    if (!selection.rangeCount) return false
    selection.getRangeAt(0).insertNode(document.createTextNode(value));
    this.nodes.div.normalize();
    var rangeStartOffset = range.startOffset;
    range.setStart(this.nodes.div.childNodes[0], rangeStartOffset +  value.length);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    this.range = range;
    this.selection = selection;
    event.preventDefault();
    event.stopPropagation();
  }

  pasteHandler(event) {
    event.preventDefault();
    event.stopPropagation();
    let paste = (event.clipboardData || window.clipboardData).getData('text');
    this.textInit(event, paste)
  }

  /**
   * 获取光标的位置
   */
  cursorHandler() {
    this.selection = window.getSelection();
    this.range = this.selection.getRangeAt(0);
  }

  keyPressHandler(event) {
    event.preventDefault();
    this.textInit(event, this.isEnterPress  ? '\n' : '\n\n');
    this.isEnterPress = true;
  }




}