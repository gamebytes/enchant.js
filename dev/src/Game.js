/**
 * @scope enchant.Game.prototype
 */
(function() {
    var game;

    /**
     * @scope enchant.Game.prototype
     */
    enchant.Game = enchant.Class.create(enchant.EventTarget, {
        /**
         [lang:ja]
         * ゲームのメインループ, シーンを管理するクラス.
         *
         * インスタンスは一つしか存在することができず, すでにインスタンスが存在する状態で
         * コンストラクタを実行した場合既存のものが上書きされる. 存在するインスタンスには
         * {@link enchant.Game.instance}からアクセスできる.
         *
         * @param {Number} width ゲーム画面の横幅.
         * @param {Number} height ゲーム画面の高さ.
         [/lang]
         [lang:en]
         * A class which is controlling the games main loop and scenes.
         *
         * There can be only one instance at a time, when the constructor is executed
         * with an instance present, the existing instance will be overwritten. The existing instance
         * can be accessed from {@link enchant.Game.instance}.
         *
         * @param {Number} width The width of the game screen.
         * @param {Number} height The height of the game screen.
         [/lang]
         [lang:de]
         * Klasse, welche die Spielschleife und Szenen kontrolliert.
         *
         * Es kann immer nur eine Instanz geben und sollte der Konstruktor ausgeführt werden,
         * obwohl bereits eine Instanz existiert, wird die vorherige Instanz überschrieben.
         * Auf die aktuell existierende Instanz kann über die {@link enchant.Game.instance}
         * Variable zugegriffen werden.
         *
         * @param {Number} width Die Breite des Spieles.
         * @param {Number} height Die Höhe des Spieles.
         [/lang]
         * @constructs
         * @extends enchant.EventTarget
         */
        initialize: function(width, height) {
            if (window.document.body === null) {
                throw new Error("document.body is null. Please excute 'new Game()' in window.onload.");
            }

            enchant.EventTarget.call(this);
            var initial = true;
            if (game) {
                initial = false;
                game.stop();
            }
            game = enchant.Game.instance = this;

            /**
             [lang:ja]
             * ゲーム画面の横幅.
             [/lang]
             [lang:en]
             * The width of the game screen.
             [/lang]
             [lang:de]
             * Breite des Spieles.
             [/lang]
             * @type {Number}
             */
            this.width = width || 320;
            /**
             [lang:ja]
             * ゲーム画面の高さ.
             [/lang]
             [lang:en]
             * The height of the game screen.
             [/lang]
             [lang:de]
             * Höhe des Spieles.
             [/lang]
             * @type {Number}
             */
            this.height = height || 320;
            /**
             [lang:ja]
             * ゲームの表示倍率.
             [/lang]
             [lang:en]
             * The scaling of the game rendering.
             [/lang]
             [lang:de]
             * Skalierung der Spieldarstellung.
             [/lang]
             * @type {Number}
             */
            this.scale = 1;

            var stage = document.getElementById('enchant-stage');
            if (!stage) {
                stage = document.createElement('div');
                stage.id = 'enchant-stage';
//                stage.style.width = window.innerWidth + 'px';
//                stage.style.height = window.innerHeight + 'px';
                stage.style.position = 'absolute';

                if (document.body.firstChild) {
                    document.body.insertBefore(stage, document.body.firstChild);
                } else {
                    document.body.appendChild(stage);
                }
                this.scale = Math.min(
                    window.innerWidth / this.width,
                    window.innerHeight / this.height
                );
                this._pageX = 0;
                this._pageY = 0;
            } else {
                var style = window.getComputedStyle(stage);
                width = parseInt(style.width, 10);
                height = parseInt(style.height, 10);
                if (width && height) {
                    this.scale = Math.min(
                        width / this.width,
                        height / this.height
                    );
                } else {
                    stage.style.width = this.width + 'px';
                    stage.style.height = this.height + 'px';
                }
                while (stage.firstChild) {
                    stage.removeChild(stage.firstChild);
                }
                stage.style.position = 'relative';

                var bounding = stage.getBoundingClientRect();
                this._pageX = Math.round(window.scrollX + bounding.left);
                this._pageY = Math.round(window.scrollY + bounding.top);
            }
            if (!this.scale) {
                this.scale = 1;
            }
            stage.style.fontSize = '12px';
            stage.style.webkitTextSizeAdjust = 'none';
            this._element = stage;

            /**
             [lang:ja]
             * ゲームのフレームレート.
             [/lang]
             [lang:en]
             * The frame rate of the game.
             [/lang]
             [lang:de]
             * Frame Rate des Spieles.
             [/lang]
             * @type {Number}
             */
            this.fps = 30;
            /**
             [lang:ja]
             * ゲーム開始からのフレーム数.
             [/lang]
             [lang:en]
             * The amount of frames since the game was started.
             [/lang]
             [lang:de]
             * Anzahl der Frames seit dem Spielestart.
             [/lang]
             * @type {Number}
             */
            this.frame = 0;
            /**
             [lang:ja]
             * ゲームが実行可能な状態かどうか.
             [/lang]
             [lang:en]
             * Indicates if the game can be executed.
             [/lang]
             [lang:de]
             * Zeigt an ob das Spiel ausgeführt werden kann.
             [/lang]
             * @type {Boolean}
             */
            this.ready = null;
            /**
             [lang:ja]
             * ゲームが実行状態かどうか.
             [/lang]
             [lang:en]
             * Indicates if the game is currently executed.
             [/lang]
             [lang:de]
             * Zeigt an ob das Spiel derzeit ausgeführt wird.
             [/lang]
             * @type {Boolean}
             */
            this.running = false;
            /**
             [lang:ja]
             * ロードされた画像をパスをキーとして保存するオブジェクト.
             [/lang]
             [lang:en]
             * Object which stores loaded objects with the path as key.
             [/lang]
             [lang:de]
             * Geladene Objekte werden unter dem Pfad als Schlüssel in diesem Objekt abgelegt.
             [/lang]
             * @type {Object.<String, Surface>}
             */
            this.assets = {};
            var assets = this._assets = [];
            (function detectAssets(module) {
                if (module.assets instanceof Array) {
                    [].push.apply(assets, module.assets);
                }
                for (var prop in module) {
                    if (module.hasOwnProperty(prop)) {
                        if (typeof module[prop] === 'object' && Object.getPrototypeOf(module[prop]) === Object.prototype) {
                            detectAssets(module[prop]);
                        }
                    }
                }
            }(enchant));

            this._scenes = [];
            /**
             [lang:ja]
             * 現在のScene. Sceneスタック中の一番上のScene.
             [/lang]
             [lang:en]
             * The Scene which is currently displayed. This Scene is on top of Scene stack.
             [/lang]
             [lang:de]
             * Die aktuell dargestellte Szene.
             * Diese Szene befindet sich oben auf dem Stapelspeicher.
             [/lang]
             * @type {enchant.Scene}
             */
            this.currentScene = null;
            /**
             [lang:ja]
             * ルートScene. Sceneスタック中の一番下のScene.
             [/lang]
             [lang:en]
             * The root Scene. The Scene at bottom of Scene stack.
             [/lang]
             [lang:de]
             * Die Ursprungsszene.
             * Diese Szene befindet sich unten auf dem Stapelspeicher.
             [/lang]
             * @type {enchant.Scene}
             */
            this.rootScene = new enchant.Scene();
            this.pushScene(this.rootScene);
            /**
             [lang:ja]
             * ローディング時に表示されるScene.
             [/lang]
             [lang:en]
             * The Scene which is getting displayed during loading.
             [/lang]
             [lang:de]
             * Die Szene, welche während des Ladevorgangs dargestellt wird.
             [/lang]
             * @type {enchant.Scene}
             */
            this.loadingScene = new enchant.Scene();
            this.loadingScene.backgroundColor = '#000';
            var barWidth = this.width * 0.4 | 0;
            var barHeight = this.width * 0.05 | 0;
            var border = barWidth * 0.03 | 0;
            var bar = new enchant.Sprite(barWidth, barHeight);

            bar.x = (this.width - barWidth) / 2;
            bar.y = (this.height - barHeight) / 2;
            var image = new enchant.Surface(barWidth, barHeight);
            image.context.fillStyle = '#fff';
            image.context.fillRect(0, 0, barWidth, barHeight);
            image.context.fillStyle = '#000';
            image.context.fillRect(border, border, barWidth - border * 2, barHeight - border * 2);
            bar.image = image;
            var progress = 0, _progress = 0;
            this.addEventListener('progress', function(e) {
                progress = e.loaded / e.total;
            });
            bar.addEventListener('enterframe', function() {
                _progress *= 0.9;
                _progress += progress * 0.1;
                image.context.fillStyle = '#fff';
                image.context.fillRect(border, 0, (barWidth - border * 2) * _progress, barHeight);
            });
            this.loadingScene.addChild(bar);

            this._mousedownID = 0;
            this._surfaceID = 0;
            this._soundID = 0;
            this._intervalID = null;

            this._offsetX = 0;
            this._offsetY = 0;

            /**
             [lang:ja]
             * ゲームに対する入力状態を保存するオブジェクト.
             [/lang]
             [lang:en]
             * Object that saves the current input state for the game.
             [/lang]
             [lang:de]
             * Objekt, welches den aktuellen Eingabestatus des Spieles speichert.
             [/lang]
             * @type {Object.<String, Boolean>}
             */
            this.input = {};
            this._keybind = enchant.ENV.KEY_BIND_TABLE || {};

            var c = 0;
            ['left', 'right', 'up', 'down', 'a', 'b'].forEach(function(type) {
                this.addEventListener(type + 'buttondown', function(e) {
                    var inputEvent;
                    if (!this.input[type]) {
                        this.input[type] = true;
                        inputEvent = new enchant.Event((c++) ? 'inputchange' : 'inputstart');
                        this.dispatchEvent(inputEvent);
                    }
                    this.currentScene.dispatchEvent(e);
                    if (inputEvent) {
                        this.currentScene.dispatchEvent(inputEvent);
                    }
                });
                this.addEventListener(type + 'buttonup', function(e) {
                    var inputEvent;
                    if (this.input[type]) {
                        this.input[type] = false;
                        inputEvent = new enchant.Event((--c) ? 'inputchange' : 'inputend');
                        this.dispatchEvent(inputEvent);
                    }
                    this.currentScene.dispatchEvent(e);
                    if (inputEvent) {
                        this.currentScene.dispatchEvent(inputEvent);
                    }
                });
            }, this);

            if (initial) {
                stage = enchant.Game.instance._element;
                var evt;
                document.addEventListener('keydown', function(e) {
                    game.dispatchEvent(new enchant.Event('keydown'));
                    if (enchant.ENV.PREVENT_DEFAULT_KEY_CODES.indexOf(e.keyCode) !== -1) {
                        e.preventDefault();
                        e.stopPropagation();
                    }

                    if (!game.running) {
                        return;
                    }
                    var button = game._keybind[e.keyCode];
                    if (button) {
                        evt = new enchant.Event(button + 'buttondown');
                        game.dispatchEvent(evt);
                    }
                }, true);
                document.addEventListener('keyup', function(e) {
                    if (!game.running) {
                        return;
                    }
                    var button = game._keybind[e.keyCode];
                    if (button) {
                        evt = new enchant.Event(button + 'buttonup');
                        game.dispatchEvent(evt);
                    }
                }, true);

                if (enchant.ENV.TOUCH_ENABLED) {
                    stage.addEventListener('touchstart', function(e) {
                        var tagName = (e.target.tagName).toLowerCase();
                        if (enchant.ENV.USE_DEFAULT_EVENT_TAGS.indexOf(tagName) === -1) {
                            e.preventDefault();
                            if (!game.running) {
                                e.stopPropagation();
                            }
                        }
                    }, true);
                    stage.addEventListener('touchmove', function(e) {
                        var tagName = (e.target.tagName).toLowerCase();
                        if (enchant.ENV.USE_DEFAULT_EVENT_TAGS.indexOf(tagName) === -1) {
                            e.preventDefault();
                            if (!game.running) {
                                e.stopPropagation();
                            }
                        }
                    }, true);
                    stage.addEventListener('touchend', function(e) {
                        var tagName = (e.target.tagName).toLowerCase();
                        if (enchant.ENV.USE_DEFAULT_EVENT_TAGS.indexOf(tagName) === -1) {
                            e.preventDefault();
                            if (!game.running) {
                                e.stopPropagation();
                            }
                        }
                    }, true);
                }
                stage.addEventListener('mousedown', function(e) {
                    var tagName = (e.target.tagName).toLowerCase();
                    if (enchant.ENV.USE_DEFAULT_EVENT_TAGS.indexOf(tagName) === -1) {
                        e.preventDefault();
                        game._mousedownID++;
                        if (!game.running) {
                            e.stopPropagation();
                        }
                    }
                }, true);
                stage.addEventListener('mousemove', function(e) {
                    var tagName = (e.target.tagName).toLowerCase();
                    if (enchant.ENV.USE_DEFAULT_EVENT_TAGS.indexOf(tagName) === -1) {
                        e.preventDefault();
                        if (!game.running) {
                            e.stopPropagation();
                        }
                    }
                }, true);
                stage.addEventListener('mouseup', function(e) {
                    var tagName = (e.target.tagName).toLowerCase();
                    if (enchant.ENV.USE_DEFAULT_EVENT_TAGS.indexOf(tagName) === -1) {
                        e.preventDefault();
                        if (!game.running) {
                            e.stopPropagation();
                        }
                    }
                }, true);
                game._touchEventTarget = null;
                var _ontouchstart = function(e) {
                    var game = enchant.Game.instance;
                    var currentScene = game.currentScene;
                    var layer, target;
                    var evt = new enchant.Event(enchant.Event.TOUCH_START);
                    evt._initPosition(e.x, e.y);
                    for (var i = currentScene._layerPriority.length - 1; i >= 0; i--) {
                        layer = currentScene._layers[currentScene._layerPriority[i]];
                        target = layer._determineEventTarget(evt);
                        if (target) {
                            break;
                        }
                    }
                    if (!target) {
                        target = currentScene;
                    }
                    game._touchEventTarget = target;
                    target.dispatchEvent(evt);
                };
                var _ontouchmove = function(e) {
                    var evt;
                    if (game._touchEventTarget) {
                        evt = new enchant.Event(enchant.Event.TOUCH_MOVE);
                        evt._initPosition(e.x, e.y);
                        game._touchEventTarget.dispatchEvent(evt);
                    }
                };
                var _ontouchend = function(e) {
                    var evt;
                    if (game._touchEventTarget) {
                        evt = new enchant.Event(enchant.Event.TOUCH_END);
                        evt._initPosition(e.x, e.y);
                        game._touchEventTarget.dispatchEvent(evt);
                        game._touchEventTarget = null;
                        game.currentScene._layers.Dom._touchEventTarget = null;
                    }
                };
                if (enchant.ENV.TOUCH_ENABLED) {
                    stage.addEventListener('touchdown', _ontouchstart, false);
                    stage.addEventListener('touchmove', _ontouchmove, false);
                    stage.addEventListener('touchup', _ontouchend, false);
                }
                stage.addEventListener('mousedown', _ontouchstart, false);
                stage.addEventListener('mousemove', _ontouchmove, false);
                stage.addEventListener('mouseup', _ontouchend, false);
            }
        },
        /**
         [lang:ja]
         * ファイルのプリロードを行う.
         *
         * プリロードを行うよう設定されたファイルは{@link enchant.Game#start}が実行されるとき
         * ロードが行われる. 全てのファイルのロードが完了したときはGameオブジェクトから{@link enchant.Event.LOAD}
         * イベントが発行され, Gameオブジェクトの{@link enchant.Game#assets}プロパティから画像ファイルの場合は
         * {@link enchant.Surface}オブジェクトとして, 音声ファイルの場合は{@link enchant.Sound}オブジェクトとして,
         * その他の場合は文字列としてアクセスできるようになる.
         *
         * なおこのSurfaceオブジェクトは{@link enchant.Surface.load}を使って作成されたものである
         * ため直接画像操作を行うことはできない. {@link enchant.Surface.load}の項を参照.
         *
         * @example
         *   game.preload('player.gif');
         *   game.onload = function() {
         *      var sprite = new Sprite(32, 32);
         *      sprite.image = game.assets['player.gif']; // パス名でアクセス
         *      ...
         *   };
         *   game.start();
         *
         * @param {...String} assets プリロードする画像のパス. 複数指定できる.
         [/lang]
         [lang:en]
         * Performs a file preload.
         *
         * Sets files which are to be preloaded. When {@link enchant.Game#start} is called the
         * actual loading takes place. When all files are loaded, a {@link enchant.Event.LOAD} event
         * is dispatched from the Game object. Depending on the type of the file different objects will be
         * created and stored in {@link enchant.Game#assets} Variable.
         * When an image file is loaded, an {@link enchant.Surface} is created. If a sound file is loaded, an
         * {@link enchant.Sound} object is created. Otherwise it will be accessible as a string.
         *
         * In addition, because this Surface object used made with {@link enchant.Surface.load},
         * direct object manipulation is not possible. Refer to the items of {@link enchant.Surface.load}
         *
         * @example
         *   game.preload('player.gif');
         *   game.onload = function() {
         *      var sprite = new Sprite(32, 32);
         *      sprite.image = game.assets['player.gif']; // Access via path
         *      ...
         *   };
         *   game.start();
         *
         * @param {...String} assets Path of images to be preloaded. Multiple settings possible.
         [/lang]
         [lang:de]
         * Lässt Dateien im voraus laden.
         *
         * Diese Methode setzt die Dateien die im voraus geladen werden sollen. Wenn {@link enchant.Game#start}
         * aufgerufen wird, findet das tatsächliche laden der Resource statt. Sollten alle Dateien vollständig
         * geladen sein, wird ein {@link enchant.Event.LOAD} Ereignis auf dem Game Objekt ausgelöst.
         * Abhängig von den Dateien die geladen werden sollen, werden unterschiedliche Objekte erstellt und in
         * dem {@link enchant.Game#assets} Feld gespeichert.
         * Falls ein Bild geladen wird, wird ein {@link enchant.Surface} Objekt erstellt. Wenn es eine Ton Datei ist,
         * wird ein {@link enchant.Sound} Objekt erstellt. Ansonsten kann auf die Datei über einen String zugegriffen werden.
         *
         * Da die Surface Objekte mittels {@link enchant.Surface.load} erstellt werden ist zusätlich ist zu beachten, dass
         * eine direkte Objektmanipulation nicht möglich ist.
         * Für diesen Fall ist auf die {@link enchant.Surface.load} Dokumentation zu verweisen.
         *
         * @example
         *   game.preload('player.gif');
         *   game.onload = function() {
         *      var sprite = new Sprite(32, 32);
         *      sprite.image = game.assets['player.gif']; // zugriff mittels Dateipfades
         *      ...
         *   };
         *   game.start();
         *
         * @param {...String} assets Pfade zu den Dateien die im voraus geladen werden sollen.
         * Mehrfachangaben möglich.
         [/lang]
         */
        preload: function(assets) {
            if (!(assets instanceof Array)) {
                assets = Array.prototype.slice.call(arguments);
            }
            [].push.apply(this._assets, assets);
        },
        /**
         [lang:ja]
         * ファイルのロードを行う.
         *
         * @param {String} asset ロードするファイルのパス.
         * @param {Function} [callback] ファイルのロードが完了したときに呼び出される関数.
         [/lang]
         [lang:en]
         * Loads a file.
         *
         * @param {String} asset File path of the resource to be loaded.
         * @param {Function} [callback] Function called up when file loading is finished.
         [/lang]
         [lang:de]
         * Laden von Dateien.
         *
         * @param {String} asset Pfad zu der Datei die geladen werden soll.
         * @param {Function} [callback] Funktion die ausgeführt wird wenn das laden abgeschlossen wurde.
         [/lang]
         */
        load: function(src, callback) {
            if (callback == null) {
                callback = function() {
                };
            }

            var ext = enchant.Game.findExt(src);

            if (enchant.Game._loadFuncs[ext]) {
                enchant.Game._loadFuncs[ext].call(this, src, callback, ext);
            }
            else {
                var req = new XMLHttpRequest();
                req.open('GET', src, true);
                req.onreadystatechange = function(e) {
                    if (req.readyState === 4) {
                        if (req.status !== 200 && req.status !== 0) {
                            throw new Error(req.status + ': ' + 'Cannot load an asset: ' + src);
                        }

                        var type = req.getResponseHeader('Content-Type') || '';
                        if (type.match(/^image/)) {
                            game.assets[src] = enchant.Surface.load(src);
                            game.assets[src].addEventListener('load', callback);
                        } else if (type.match(/^audio/)) {
                            game.assets[src] = enchant.Sound.load(src, type);
                            game.assets[src].addEventListener('load', callback);
                        } else {
                            game.assets[src] = req.responseText;
                            callback();
                        }
                    }
                };
                req.send(null);
            }
        },
        /**
         [lang:ja]
         * ゲームを開始する.
         *
         * enchant.Game#fpsで設定されたフレームレートに従ってenchant.Game#currentSceneの
         * フレームの更新が行われるようになる. プリロードする画像が存在する場合はロードが
         * 始まりローディング画面が表示される.
         [/lang]
         [lang:en]
         * Start the game.
         *
         * Obeying the frame rate set in {@link enchant.Game#fps}, the frame in
         * {@link enchant.Game#currentScene} will be updated. If images to preload are present,
         * loading will begin and the loading screen will be displayed.
         [/lang]
         [lang:de]
         * Starte das Spiel
         *
         * Je nach der Frame Rate definiert in {@link enchant.Game#fps}, wird der Frame in der
         * {@link enchant.Game#currentScene} aktualisiert. Sollten Dateien die im voraus geladen werden
         * sollen vorhanden sein, beginnt das laden dieser Dateien und der Ladebildschirm wird dargestellt.
         [/lang]
         */
        start: function() {
            if (this._intervalID) {
                window.clearInterval(this._intervalID);
            } else if (this._assets.length) {
                if (enchant.Sound.enabledInMobileSafari && !game._touched &&
                    enchant.ENV.VENDOR_PREFIX === 'webkit' && enchant.ENV.TOUCH_ENABLED) {
                    var scene = new enchant.Scene();
                    scene.backgroundColor = '#000';
                    var size = Math.round(game.width / 10);
                    var sprite = new enchant.Sprite(game.width, size);
                    sprite.y = (game.height - size) / 2;
                    sprite.image = new enchant.Surface(game.width, size);
                    sprite.image.context.fillStyle = '#fff';
                    sprite.image.context.font = (size - 1) + 'px bold Helvetica,Arial,sans-serif';
                    var width = sprite.image.context.measureText('Touch to Start').width;
                    sprite.image.context.fillText('Touch to Start', (game.width - width) / 2, size - 1);
                    scene.addChild(sprite);
                    document.addEventListener('touchstart', function() {
                        game._touched = true;
                        game.removeScene(scene);
                        game.start();
                    }, true);
                    game.pushScene(scene);
                    return;
                }

                var o = {};
                var assets = this._assets.filter(function(asset) {
                    return asset in o ? false : o[asset] = true;
                });
                var loaded = 0,
                    len = assets.length,
                    loadFunc = function() {
                        var e = new enchant.Event('progress');
                        e.loaded = ++loaded;
                        e.total = len;
                        game.dispatchEvent(e);
                        if (loaded === len) {
                            game.removeScene(game.loadingScene);
                            game.dispatchEvent(new enchant.Event('load'));
                        }
                    };

                for (var i = 0; i < len; i++) {
                    this.load(assets[i], loadFunc);
                }
                this.pushScene(this.loadingScene);
            } else {
                this.dispatchEvent(new enchant.Event('load'));
            }
            this.currentTime = this.getTime();
            this._intervalID = window.setInterval(function() {
                game._tick();
            }, 1000 / this.fps);
            this.running = true;
        },
        /**
         [lang:ja]
         * ゲームをデバッグモードで開始する.
         *
         * enchant.Game.instance._debug フラグを true にすることでもデバッグモードをオンにすることができる
         [/lang]
         [lang:en]
         * Begin game debug mode.
         *
         * Game debug mode can be set to on even if enchant.Game.instance._debug
         * flag is already set to true.
         [/lang]
         [lang:de]
         * Startet den Debug-Modus des Spieles.
         *
         * Auch wenn die enchant.Game.instance._debug Variable gesetzt ist,
         * kann der Debug-Modus gestartet werden.
         [/lang]
         */
        debug: function() {
            this._debug = true;
            this.rootScene.addEventListener("enterframe", function(time) {
                this._actualFps = (1 / time);
            });
            this.start();
        },
        actualFps: {
            get: function() {
                return this._actualFps || this.fps;
            }
        },
        _tick: function() {
            var now = this.getTime();
            var e = new enchant.Event('enterframe');
            e.elapsed = now - this.currentTime;
            this.currentTime = now;

            var nodes = this.currentScene.childNodes.slice();
            var push = Array.prototype.push;
            while (nodes.length) {
                var node = nodes.pop();
                node.age++;
                node.dispatchEvent(e);
                if (node.childNodes) {
                    push.apply(nodes, node.childNodes);
                }
            }

            this.currentScene.age++;
            this.currentScene.dispatchEvent(e);
            this.dispatchEvent(e);

            this.dispatchEvent(new enchant.Event('exitframe'));
            this.frame++;
        },
        getTime: function() {
            if (window.performance && window.performance.now) {
                return window.performance.now();
            }else if(window.performance && window.performance.webkitNow){
                return window.performance.webkitNow();
            }else{
                return Date.now();
            }
        },
        /**
         [lang:ja]
         * ゲームを停止する.
         *
         * フレームは更新されず, プレイヤーの入力も受け付けなくなる.
         * {@link enchant.Game#start}で再開できる.
         [/lang]
         [lang:en]
         * Stops the game.
         *
         * The frame will not be updated, and player input will not be accepted anymore.
         * Game can be restarted using {@link enchant.Game#start}.
         [/lang]
         [lang:de]
         * Stoppt das Spiel.
         *
         * Der Frame wird nicht mehr aktualisiert und Spielereingaben werden nicht
         * mehr akzeptiert. Das spiel kann mit der {@link enchant.Game#start} Methode
         * erneut gestartet werden.
         [/lang]
         */
        stop: function() {
            if (this._intervalID) {
                window.clearInterval(this._intervalID);
                this._intervalID = null;
            }
            this.running = false;
        },
        /**
         [lang:ja]
         * ゲームを一時停止する.
         *
         * フレームは更新されず, プレイヤーの入力は受け付ける.
         * {@link enchant.Game#start}で再開できる.
         [/lang]
         [lang:en]
         * Stops the game.
         *
         * The frame will not be updated, and player input will not be accepted anymore.
         * Game can be started again using {@link enchant.Game#start}.
         [/lang]
         [lang:de]
         * Stoppt das Spiel.
         *
         * Der Frame wird nicht mehr aktualisiert und Spielereingaben werden nicht
         * mehr akzeptiert. Das spiel kann mit der {@link enchant.Game#start} Methode
         * erneut gestartet werden.
         [/lang]
         */
        pause: function() {
            if (this._intervalID) {
                window.clearInterval(this._intervalID);
                this._intervalID = null;
            }
        },
        /**
         [lang:ja]
         * ゲームを再開する。
         [/lang]
         [lang:en]
         * Resumes the game.
         [/lang]
         [lang:de]
         * Setzt die Ausführung des Spieles fort.
         [/lang]
         */
        resume: function() {
            if (this._intervalID) {
                return;
            }
            this.currentTime = this.getTime();
            this._intervalID = window.setInterval(function() {
                game._tick();
            }, 1000 / this.fps);
            this.running = true;
        },

        /**
         [lang:ja]
         * 新しいSceneに移行する.
         *
         * Sceneはスタック状に管理されており, 表示順序もスタックに積み上げられた順に従う.
         * {@link enchant.Game#pushScene}を行うとSceneをスタックの一番上に積むことができる. スタックの
         * 一番上のSceneに対してはフレームの更新が行われる.
         *
         * @param {enchant.Scene} scene 移行する新しいScene.
         * @return {enchant.Scene} 新しいScene.
         [/lang]
         [lang:en]
         * Switch to a new Scene.
         *
         * Scenes are controlled using a stack, and the display order also obeys that stack order.
         * When {@link enchant.Game#pushScene} is executed, the Scene can be brought to the top of stack.
         * Frames will be updated in the Scene which is on the top of the stack.
         *
         * @param {enchant.Scene} scene The new scene to be switched to.
         * @return {enchant.Scene} The new Scene.
         [/lang]
         [lang:de]
         * Wechselt zu einer neuen Szene.
         *
         * Szenen werden durch einen Stapelspeicher kontrolliert und die Darstellungsreihenfolge
         * folgt ebenfalls der Ordnung des Stapelspeichers.
         * Wenn die {@link enchant.Game#pushScene} Methode ausgeführt wird, wird die Szene auf dem
         * Stapelspeicher oben abgelegt. Der Frame wird immer in der Szene ganz oben auf dem Stapelspeicher
         * aktualisiert.
         *
         * @param {enchant.Scene} scene Die neue Szene zu der gewechselt werden soll.
         * @return {enchant.Scene} Die neue Szene.
         [/lang]
         */
        pushScene: function(scene) {
            this._element.appendChild(scene._element);
            if (this.currentScene) {
                this.currentScene.dispatchEvent(new enchant.Event('exit'));
            }
            this.currentScene = scene;
            this.currentScene.dispatchEvent(new enchant.Event('enter'));
            return this._scenes.push(scene);
        },
        /**
         [lang:ja]
         * 現在のSceneを終了させ前のSceneに戻る.
         *
         * Sceneはスタック状に管理されており, 表示順序もスタックに積み上げられた順に従う.
         * {@link enchant.Game#popScene}を行うとスタックの一番上のSceneを取り出すことができる.
         *
         * @return {enchant.Scene} 終了させたScene.
         [/lang]
         [lang:en]
         * Ends the current Scene, return to the previous Scene.
         *
         * Scenes are controlled using a stack, and the display order also obeys that stack order.
         * When {@link enchant.Game#popScene} is executed, the Scene at the top of the stack
         * will be removed and returned.
         *
         * @return {enchant.Scene} Ended Scene.
         [/lang]
         [lang:de]
         * Beendet die aktuelle Szene und wechselt zu der vorherigen Szene.
         *
         * Szenen werden durch einen Stapelspeicher kontrolliert und die Darstellungsreihenfolge
         * folgt ebenfalls der Ordnung des Stapelspeichers.
         * Wenn die {@link enchant.Game#popScene} Methode ausgeführt wird, wird die Szene oben auf dem
         * Stapelspeicher entfernt und liefert diese als Rückgabewert.
         *
         * @return {enchant.Scene} Die Szene, die beendet wurde.
         [/lang]
         */
        popScene: function() {
            if (this.currentScene === this.rootScene) {
                return this.currentScene;
            }
            this._element.removeChild(this.currentScene._element);
            this.currentScene.dispatchEvent(new enchant.Event('exit'));
            this.currentScene = this._scenes[this._scenes.length - 2];
            this.currentScene.dispatchEvent(new enchant.Event('enter'));
            return this._scenes.pop();
        },
        /**
         [lang:ja]
         * 現在のSceneを別のSceneにおきかえる.
         *
         * {@link enchant.Game#popScene}, {@link enchant.Game#pushScene}を同時に行う.
         *
         * @param {enchant.Scene} scene おきかえるScene.
         * @return {enchant.Scene} 新しいScene.
         [/lang]
         [lang:en]
         * Overwrites the current Scene with a new Scene.
         *
         * {@link enchant.Game#popScene}, {@link enchant.Game#pushScene} are executed after
         * each other to replace to current scene with the new scene.
         *
         * @param {enchant.Scene} scene The new scene which will replace the previous scene.
         * @return {enchant.Scene} The new Scene.
         [/lang]
         [lang:de]
         * Ersetzt die aktuelle Szene durch eine neue Szene.
         *
         * {@link enchant.Game#popScene}, {@link enchant.Game#pushScene} werden nacheinander
         * ausgeführt um die aktuelle Szene durch die neue zu ersetzen.
         *
         * @param {enchant.Scene} scene Die neue Szene, welche die aktuelle Szene ersetzen wird.
         * @return {enchant.Scene} Die neue Szene.
         [/lang]
         */
        replaceScene: function(scene) {
            this.popScene();
            return this.pushScene(scene);
        },
        /**
         [lang:ja]
         * Scene削除する.
         *
         * Sceneスタック中からSceneを削除する.
         *
         * @param {enchant.Scene} scene 削除するScene.
         * @return {enchant.Scene} 削除したScene.
         [/lang]
         [lang:en]
         * Removes a Scene.
         *
         * Removes a Scene from the Scene stack.
         *
         * @param {enchant.Scene} scene Scene to be removed.
         * @return {enchant.Scene} The deleted Scene.
         [/lang]
         [lang:de]
         * Entfernt eine Szene.
         *
         * Entfernt eine Szene aus dem Szenen-Stapelspeicher.
         *
         * @param {enchant.Scene} scene Die Szene die entfernt werden soll.
         * @return {enchant.Scene} Die entfernte Szene.
         [/lang]
         */
        removeScene: function(scene) {
            if (this.currentScene === scene) {
                return this.popScene();
            } else {
                var i = this._scenes.indexOf(scene);
                if (i !== -1) {
                    this._scenes.splice(i, 1);
                    this._element.removeChild(scene._element);
                    return scene;
                } else {
                    return null;
                }
            }
        },
        /**
         [lang:ja]
         * キーバインドを設定する.
         *
         * キー入力をleft, right, up, down, a, bいずれかのボタン入力として割り当てる.
         *
         * @param {Number} key キーバインドを設定するキーコード.
         * @param {String} button 割り当てるボタン (left, right, up, down, a, b).
         [/lang]
         [lang:en]
         * Set a key binding.
         *
         * Maps an input key to an enchant.js left, right, up, down, a, b button.
         *
         * @param {Number} key Key code for the button which will be bound.
         * @param {String} button The enchant.js button (left, right, up, down, a, b).
         [/lang]
         [lang:de]
         * Bindet eine Taste.
         *
         * Diese Methode bindet eine Taste an einen in enchant.js verwendeten Knopf (Button).
         *
         * @param {Number} key Der Tastencode der Taste die gebunden werden soll.
         * @param {String} button Der enchant.js Knopf (left, right, up, down, a, b).
         [/lang]
         */
        keybind: function(key, button) {
            this._keybind[key] = button;
        },
        /**
         [lang:ja]
         * Game#start が呼ばれてから経過したゲーム内時間を取得する
         * 経過した総フレーム数をfpsで割っている
         * @return {Number} 経過したゲーム内時間 (秒)
         [/lang]
         [lang:en]
         * Get the elapsed game time (not actual) from when game.start was called.
         * @return {Number} The elapsed time (seconds)
         [/lang]
         [lang:de]
         * Liefert die vergange Spielzeit (keine reale) die seit dem Aufruf von game.start
         * vergangen ist.
         * @return {Number} Die vergangene Zeit (Sekunden)
         [/lang]
         */
        getElapsedTime: function() {
            return this.frame / this.fps;
        }
    });

    enchant.Game._loadFuncs = {};
    enchant.Game._loadFuncs['jpg'] =
        enchant.Game._loadFuncs['jpeg'] =
            enchant.Game._loadFuncs['gif'] =
                enchant.Game._loadFuncs['png'] =
                    enchant.Game._loadFuncs['bmp'] = function(src, callback) {
                        this.assets[src] = enchant.Surface.load(src);
                        this.assets[src].addEventListener('load', callback);
                    };
    enchant.Game._loadFuncs['mp3'] =
        enchant.Game._loadFuncs['aac'] =
            enchant.Game._loadFuncs['m4a'] =
                enchant.Game._loadFuncs['wav'] =
                    enchant.Game._loadFuncs['ogg'] = function(src, callback, ext) {
                        this.assets[src] = enchant.Sound.load(src, 'audio/' + ext);
                        this.assets[src].addEventListener('load', callback);
                    };


    /**
     * Get the file extension from a path
     * @param path
     * @return {*}
     */
    enchant.Game.findExt = function(path) {
        var matched = path.match(/\.\w+$/);
        if (matched && matched.length > 0) {
            return matched[0].slice(1).toLowerCase();
        }

        // for data URI
        if (path.indexOf('data:') === 0) {
            return path.split(/[\/;]/)[1].toLowerCase();
        }
        return null;
    };

    /**
     [lang:ja]
     * 現在のGameインスタンス.
     [/lang]
     [lang:en]
     * The Current Game instance.
     [/lang]
     [lang:de]
     * Die aktuelle Instanz des Spieles.
     [/lang]
     * @type {enchant.Game}
     * @static
     */
    enchant.Game.instance = null;
}());
