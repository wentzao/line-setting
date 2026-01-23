!function (e) {
    function t(t) {
        for (var n, r, a = t[0], l = t[1], d = t[2], u = 0, p = []; u < a.length; u++)
            r = a[u],
                Object.prototype.hasOwnProperty.call(s, r) && s[r] && p.push(s[r][0]),
                s[r] = 0;
        for (n in l)
            Object.prototype.hasOwnProperty.call(l, n) && (e[n] = l[n]);
        for (c && c(t); p.length;)
            p.shift()();
        return i.push.apply(i, d || []),
            o()
    }
    function o() {
        for (var e, t = 0; t < i.length; t++) {
            for (var o = i[t], n = !0, a = 1; a < o.length; a++) {
                var l = o[a];
                0 !== s[l] && (n = !1)
            }
            n && (i.splice(t--, 1),
                e = r(r.s = o[0]))
        }
        return e
    }
    var n = {}
        , s = {
            2: 0
        }
        , i = [];
    function r(t) {
        if (n[t])
            return n[t].exports;
        var o = n[t] = {
            i: t,
            l: !1,
            exports: {}
        };
        return e[t].call(o.exports, o, o.exports, r),
            o.l = !0,
            o.exports
    }
    r.m = e,
        r.c = n,
        r.d = function (e, t, o) {
            r.o(e, t) || Object.defineProperty(e, t, {
                enumerable: !0,
                get: o
            })
        }
        ,
        r.r = function (e) {
            "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, {
                value: "Module"
            }),
                Object.defineProperty(e, "__esModule", {
                    value: !0
                })
        }
        ,
        r.t = function (e, t) {
            if (1 & t && (e = r(e)),
                8 & t)
                return e;
            if (4 & t && "object" == typeof e && e && e.__esModule)
                return e;
            var o = Object.create(null);
            if (r.r(o),
                Object.defineProperty(o, "default", {
                    enumerable: !0,
                    value: e
                }),
                2 & t && "string" != typeof e)
                for (var n in e)
                    r.d(o, n, function (t) {
                        return e[t]
                    }
                        .bind(null, n));
            return o
        }
        ,
        r.n = function (e) {
            var t = e && e.__esModule ? function () {
                return e.default
            }
                : function () {
                    return e
                }
                ;
            return r.d(t, "a", t),
                t
        }
        ,
        r.o = function (e, t) {
            return Object.prototype.hasOwnProperty.call(e, t)
        }
        ,
        r.p = "/flex-simulator/";
    var a = window.webpackJsonp = window.webpackJsonp || []
        , l = a.push.bind(a);
    a.push = t,
        a = a.slice();
    for (var d = 0; d < a.length; d++)
        t(a[d]);
    var c = l;
    i.push([99, 0]),
        o()
}({
    18: function (e, t, o) { },
    19: function (e) {
        e.exports = JSON.parse('{"en":{"cancel":"Cancel","create":"Create","copy":"Copy","copied":"Copied","apply":"Apply","close":"Close","send":"Send","json_spec":"JSON spec","register_destination":"Register destination","back_to_home":"HOME","unregister":"Unregister","next":"Next","register_destination.line1":"First, scan this QR code in your LINE app.","register_destination.line2":"You will receive a validation code on the app. Enter the code in the form below.","validation_code":"Validation code","valid_until":"Valid until","register_destination.line3":"You are about to register the following destination. Are you sure?","register_destination.line_unregister":"Your current destination will be unregistered:","to_receive_message_add_frined.prefix":"To receive the test message, you need to","to_receive_message_add_frined.link":"add Flex Message Simulator LINE Official Account","to_receive_message_add_frined.suffix":" as a friend in LINE App.","issue_verification_code":"Issue validation code","liff_register.line1":"The following person is about to register you as a destination in the Flex Message Simulator.","liff_register.line2":"If you are sure, select \\"Issue validation code\\" to proceed.","liff_register.line3":"If you are sure, enter the following code in the Flex Message Simulator.","destination_label":"Destination:","failed_to_verify_code":"This code is unavailable.","invalid_token":"Expired invitation. Please re-issue the invitation QR code.","inviter_is_same_as_you":"You are invited as destination of the Flex Message Simulator, but you are already registered as destination.","user_must_be_friend_with_bot":"You are not friends with the Flex Message Simulator LINE Official Account."},"ja":{"cancel":"キャンセル","create":"作成","copy":"コピー","copied":"コピーしました","apply":"適用","close":"閉じる","send":"送信","json_spec":"JSON仕様","register_destination":"送信先を登録","back_to_home":"トップへ戻る","unregister":"登録解除","next":"次へ","register_destination.line1":"次のQRコードをLINEでスキャンしてください","register_destination.line2":"LINE上に表示される検証コードを次のフォームに入力してください","validation_code":"検証コード","valid_until":"有効期限","register_destination.line3":"次のLINEアカウントを送信先として追加します。よろしいですか？","register_destination.line_unregister":"現在登録中の送信先は削除されます","to_receive_message_add_frined.prefix":"テストメッセージを受信するには、LINEで","to_receive_message_add_frined.link":"Flex Message SimulatorのLINE公式アカウントを追加","to_receive_message_add_frined.suffix":"する必要があります","issue_verification_code":"検証コードを発行","liff_register.line1":"次のアカウントがFlex Message Simulatorで、あなたを送信先として登録しようとしています","liff_register.line2":"よろしければ「検証コードを発行」ボタンを押してください","liff_register.line3":"次の検証コードをFlex Message Simulatorに入力してください","destination_label":"送信先:","failed_to_verify_code":"検証コードが有効ではありせん","invalid_token":"無効なトークンです。登録用QRコードを再発行してください","inviter_is_same_as_you":"Flex Message Simulatorの送信先として招待されていますが、あなたは既に送信先として登録済みです","user_must_be_friend_with_bot":"Flex Message SimulatorのLINE公式アカウントと、友だちである必要があります"}}')
    },
    21: function (e, t, o) { },
    22: function (e, t, o) { },
    3: function (e, t, o) {
        "use strict";
        const n = {
            API_ROOT: "/api",
            ...(s = {
                real: {
                    LOGIN_ENDPOINT: "https://account.line.biz/login",
                    LIFF_URL: "https://liff.line.me/1655988307-x8AN9nro",
                    OA_QR: "https://qr-official.line.me/sid/L/574jeoaw.png"
                },
                rc: {
                    LOGIN_ENDPOINT: "https://account.line-rc.biz/login",
                    LIFF_URL: "https://liff.line-rc.me/1655988307-KGrzg50p",
                    OA_QR: "https://qr-official.line.me/sid/L/574jeoaw.png"
                },
                beta: {
                    LOGIN_ENDPOINT: "https://account.line-beta.biz/login",
                    LIFF_URL: "https://liff.line-beta.me/1651823217-A0baOb1q",
                    OA_QR: "https://qr-official.line-beta.me/sid/L/082dfuri.png"
                },
                local: {
                    LOGIN_ENDPOINT: "https://account.line-beta.biz/login",
                    LIFF_URL: "https://liff.line-beta.me/1651826828-8lQZdOq5",
                    OA_QR: "https://qr-official.line-beta.me/sid/L/839cpqir.png"
                }
            },
                "developers.line.biz" === window.location.hostname ? s.real : window.location.hostname.match(/[.]line-rc[.]biz$/) ? s.rc : window.location.hostname.match(/[.]line-beta[.]biz$/) ? s.beta : s.local),
            get LIFF_ID() {
                return this.LIFF_URL.match(/[^\/]+$/)[0]
            }
        };
        var s;
        t.a = n
    },
    33: function (e, t, o) { },
    34: function (e, t, o) { },
    38: function (e, t, o) { },
    46: function (e, t, o) {
        e.exports = o.p + "images/logo-black.png"
    },
    47: function (e, t, o) {
        "use strict";
        o(21)
    },
    48: function (e, t, o) {
        "use strict";
        o(22)
    },
    91: function (e, t, o) {
        "use strict";
        o(33)
    },
    92: function (e, t, o) {
        "use strict";
        o(34)
    },
    97: function (e, t, o) {
        "use strict";
        o(38)
    },
    99: function (e, t, o) {
        "use strict";
        o.r(t);
        var n = o(2)
            , s = o(4)
            , i = {
                name: "InboxPane",
                data: () => ({
                    dismissSecs: 5,
                    dismissCountDown: 0
                }),
                computed: {
                    messages() {
                        return this.showAlert(),
                            this.$store.getters.getMessages
                    }
                },
                methods: {
                    countDownChanged(e) {
                        this.dismissCountDown = e
                    },
                    showAlert() {
                        this.dismissCountDown = this.dismissSecs
                    }
                }
            }
            , r = o(0)
            , a = Object(r.a)(i, (function () {
                var e = this
                    , t = e.$createElement
                    , o = e._self._c || t;
                return o("div", {
                    attrs: {
                        id: "inbox-pane"
                    }
                }, [e._l(e.messages, (function (t, n) {
                    return ["success" === t.level ? o("b-alert", {
                        key: n,
                        attrs: {
                            variant: "success",
                            dismissible: "",
                            fade: "",
                            show: e.dismissCountDown
                        },
                        on: {
                            "dismiss-count-down": e.countDownChanged
                        }
                    }, [o("i", {
                        staticClass: "fa fa-check"
                    }), e._v(" "), t.path ? o("strong", [e._v("\n        " + e._s(t.path) + "\n      ")]) : e._e(), e._v(" " + e._s(t.text) + "\n    ")]) : o("b-alert", {
                        key: n,
                        attrs: {
                            variant: "danger",
                            dismissible: "",
                            fade: "",
                            show: e.dismissCountDown
                        },
                        on: {
                            "dismiss-count-down": e.countDownChanged
                        }
                    }, [o("i", {
                        staticClass: "fa fa-exclamation-triangle"
                    }), e._v(" "), t.path ? o("strong", [e._v("\n        " + e._s(t.path) + "\n      ")]) : e._e(), e._v(" " + e._s(t.text) + "\n    ")])]
                }
                ))], 2)
            }
            ), [], !1, null, null, null).exports;
        function l(e) {
            return Object.assign({
                name: "none",
                canCopy: !0,
                canMove: !0,
                isAddable: !1,
                addableTypes: [],
                isRemovable: !1,
                iconClass: null,
                isDeprecated: !1
            }, e)
        }
        class d {
            static of(e) {
                if (!e)
                    return null;
                switch (e.type) {
                    case "carousel":
                        return l({
                            name: "carousel",
                            canCopy: !1,
                            canMove: !1,
                            isAddable: !0,
                            isRemovable: !1,
                            addableTypes: ["bubble"]
                        });
                    case "bubble":
                        return function (e) {
                            const t = !!e.root;
                            return l({
                                name: "bubble",
                                canMove: !t,
                                isRemovable: !t
                            })
                        }(e);
                    case "box":
                        return function (e) {
                            let t = []
                                , o = "box";
                            switch (e.layout) {
                                case "baseline":
                                    t = ["icon", "text", "filler"],
                                        o = "box [baseline]";
                                    break;
                                case "horizontal":
                                case "vertical":
                                    t = ["box", "image", "text", "button", "filler", "separator"],
                                        o = `box [${e.layout}]`
                            }
                            return l({
                                name: o,
                                isAddable: !0,
                                addableTypes: t,
                                isRemovable: !0
                            })
                        }(e);
                    case "header":
                    case "hero":
                    case "body":
                    case "footer":
                        return function (e) {
                            return l({
                                name: e.type,
                                canCopy: !1,
                                canMove: !1,
                                isAddable: 0 === e.children.length,
                                addableTypes: "hero" === e.type ? ["box", "image", "video"] : ["box"]
                            })
                        }(e);
                    case "text":
                        return function (e) {
                            let t = "text";
                            const o = e.children;
                            if (Array.isArray(o) && o.length > 0)
                                t = "text";
                            else if (e.text) {
                                let o = e.text;
                                o.length > 10 && (o = o.substring(0, 9) + "..."),
                                    t = t + " [" + o + "]"
                            }
                            return l({
                                name: t,
                                isRemovable: !0,
                                iconClass: "fa-font",
                                isAddable: !0,
                                addableTypes: ["span"]
                            })
                        }(e);
                    case "span":
                        return function (e) {
                            let t = "span";
                            if (e.text) {
                                let o = e.text;
                                o.length > 10 && (o = o.substring(0, 9) + "..."),
                                    t = t + " [" + o + "]"
                            }
                            return l({
                                name: t,
                                isRemovable: !0,
                                iconClass: "fa-font"
                            })
                        }(e);
                    case "image":
                        return l({
                            name: "image",
                            isRemovable: !0,
                            iconClass: "fa-picture-o"
                        });
                    case "video":
                        return function (e) {
                            let t = "video";
                            return 0 === e.children.length && (t += " (Please set altContent by adding child node)"),
                                l({
                                    name: t,
                                    isRemovable: !0,
                                    isAddable: 0 === e.children.length,
                                    iconClass: "fa-picture-o",
                                    addableTypes: ["box", "image"]
                                })
                        }(e);
                    case "button":
                        return function (e) {
                            let t = "button";
                            return e.action && e.action.label && (t = t + " [" + e.action.label + "]"),
                                l({
                                    name: t,
                                    isRemovable: !0,
                                    iconClass: "fa-caret-square-o-right"
                                })
                        }(e);
                    case "filler":
                        return l({
                            name: "filler",
                            isRemovable: !0,
                            iconClass: "fa-arrows"
                        });
                    case "icon":
                        return l({
                            name: "icon",
                            isRemovable: !0,
                            iconClass: "fa-smile-o"
                        });
                    case "separator":
                        return l({
                            name: "separator",
                            isRemovable: !0,
                            iconClass: "fa-minus-square-o"
                        });
                    case "spacer":
                        return l({
                            name: "spacer",
                            isRemovable: !0,
                            iconClass: "fa-square-o",
                            isDeprecated: !0
                        });
                    default:
                        throw new Error("unexpected type: " + e.type)
                }
            }
        }
        var c = {
            name: "TreeItem",
            props: {
                node: {
                    type: Object,
                    required: !0
                }
            },
            data: () => ({
                open: !0
            }),
            computed: {
                nodeExt() {
                    return d.of(this.node)
                },
                isFocused() {
                    return this.$store.getters.getMultiSelectedNodeIds.includes(this.node.id)
                },
                hasError() {
                    return this.$store.getters.getErrors.findIndex(e => e.node.id === this.node.id) >= 0
                },
                classObject() {
                    return {
                        "has-error": this.hasError,
                        deprecated: this.nodeExt.isDeprecated
                    }
                }
            },
            methods: {
                select(e) {
                    this.isFocused ? this.$store.commit("removeSelectedNodeId", this.node.id) : !function (e) {
                        return e.ctrlKey && !e.metaKey || !e.ctrlKey && e.metaKey
                    }(e) ? this.$store.commit("setSelectedNodeId", this.node.id) : this.$store.commit("addSelectedNodeId", this.node.id)
                },
                enter() {
                    this.$store.commit("setHoveredNodeId", this.node.id)
                },
                leave() {
                    this.$store.commit("setHoveredNodeId", "")
                },
                toggle() {
                    this.open = !this.open
                }
            }
        }
            , u = {
                name: "TreePane",
                components: {
                    TreeItem: Object(r.a)(c, (function () {
                        var e = this
                            , t = e.$createElement
                            , o = e._self._c || t;
                        return e.node.type ? o("li", {
                            class: e.classObject
                        }, [o("div", {
                            class: {
                                focused: e.isFocused
                            },
                            on: {
                                mouseenter: e.enter,
                                mouseleave: e.leave,
                                click: e.select
                            }
                        }, [e.node.children ? o("span", {
                            staticClass: "node-icon",
                            on: {
                                click: e.toggle
                            }
                        }, [e.open ? o("i", {
                            staticClass: "fa fa-caret-down"
                        }) : o("i", {
                            staticClass: "fa fa-caret-right"
                        })]) : o("span", {
                            staticClass: "node-icon"
                        }, [e.nodeExt.iconClass ? o("i", {
                            staticClass: "fa",
                            class: e.nodeExt.iconClass
                        }) : e._e()]), e._v(" "), o("span", {
                            staticClass: "node-name"
                        }, [e._v("\n      " + e._s(e.nodeExt.name) + "\n    ")])]), e._v(" "), e.node.children ? o("ul", {
                            directives: [{
                                name: "show",
                                rawName: "v-show",
                                value: e.open,
                                expression: "open"
                            }]
                        }, e._l(e.node.children, (function (e) {
                            return o("TreeItem", {
                                key: e.id,
                                attrs: {
                                    node: e
                                }
                            })
                        }
                        )), 1) : e._e()]) : e._e()
                    }
                    ), [], !1, null, null, null).exports
                },
                computed: {
                    tree() {
                        return this.$store.getters.getTree
                    }
                }
            }
            , p = Object(r.a)(u, (function () {
                var e = this.$createElement
                    , t = this._self._c || e;
                return t("div", {
                    attrs: {
                        id: "tree-pane"
                    }
                }, [this.tree ? t("ul", [t("TreeItem", {
                    attrs: {
                        node: this.tree
                    }
                })], 1) : this._e()])
            }
            ), [], !1, null, null, null).exports;
        var m = {
            name: "ViewerPane",
            computed: {
                html() {
                    return this.$store.getters.getHtml
                },
                hoveredNodeId() {
                    return this.$store.getters.getHoveredNodeId
                },
                classObject() {
                    const e = this.$store.getters.getContainerType;
                    return {
                        flexSolo: "bubble" === e,
                        flexCarousel: "carousel" === e
                    }
                }
            },
            watch: {
                html(e) {
                    const t = this.$refs.frame.contentWindow.document;
                    t.open(),
                        e && (t.write(e),
                            t.write('<div id="highlight"></div>'),
                            t.write("\n<style>\n  #highlight {\n    position: absolute;\n    z-index: 100;\n    background-color: #999999;\n    opacity: 0.5;\n    display: none;\n  }\n</style>")),
                        t.close()
                },
                hoveredNodeId(e) {
                    const t = this.$refs.frame.contentWindow.document
                        , o = t.getElementById("highlight");
                    if (o && (o.style.display = "none"),
                        e && o) {
                        const n = t.getElementById(e);
                        if (n) {
                            const e = n.getBoundingClientRect();
                            o.style.display = "block",
                                o.style.top = e.top + "px",
                                o.style.left = e.left + "px",
                                o.style.width = e.width + "px",
                                o.style.height = e.height + "px"
                        }
                    }
                }
            }
        }
            , h = Object(r.a)(m, (function () {
                var e = this.$createElement
                    , t = this._self._c || e;
                return t("div", {
                    attrs: {
                        id: "viewer-pane"
                    }
                }, [t("iframe", {
                    ref: "frame",
                    class: this.classObject,
                    attrs: {
                        id: "viewer-frame",
                        scrolling: "no"
                    }
                })])
            }
            ), [], !1, null, null, null).exports;
        class f {
            static ofText(e, t, o = {}) {
                const n = o.newline;
                return n && t && (t = t.replace(/\n/g, "\\n")),
                {
                    type: "text",
                    name: e,
                    value: t,
                    parser: e => n && e ? e.replace(/\\n/g, "\n") : e,
                    ...o
                }
            }
            static ofNumber(e, t, o = {}) {
                return {
                    type: "text",
                    name: e,
                    value: t,
                    parser: e => {
                        const t = parseFloat(e);
                        return isNaN(t) ? e : t
                    }
                    ,
                    ...o
                }
            }
            static ofBool(e, t, o = {}) {
                const n = Object.assign({
                    options: ["true", "false"]
                }, o);
                return {
                    type: "text",
                    name: e,
                    value: "boolean" == typeof t ? Boolean(t).toString() : void 0,
                    parser: e => "true" === e,
                    ...n
                }
            }
        }
        var v = {
            name: "FieldView",
            props: {
                id: {
                    type: String,
                    required: !0
                },
                field: {
                    type: Object,
                    required: !0
                },
                parent: {
                    type: String,
                    required: !1,
                    default: null
                },
                label: {
                    type: String,
                    required: !1,
                    default: null
                }
            },
            computed: {
                classObject() {
                    return {
                        "form-control": !0,
                        "is-invalid": this.messages.length > 0
                    }
                },
                messages() {
                    return this.$store.getters.getErrors.filter(e => e.node.id === this.id).filter(e => e.property === this.field.name).filter(e => null === this.parent || e.parent === this.parent).map(e => e.text)
                }
            },
            methods: {
                change(e) {
                    if (this.$listeners && this.$listeners.change)
                        return void this.$emit("change", e);
                    const t = e.target.value;
                    this.update(t)
                },
                update(e) {
                    null != e && e.length > 0 ? this.$store.commit("updateProperty", {
                        id: this.id,
                        property: this.field.name,
                        value: this.field.parser(e),
                        parent: this.parent
                    }) : this.$store.commit("deleteProperty", {
                        id: this.id,
                        property: this.field.name,
                        parent: this.parent
                    })
                }
            }
        }
            , g = Object(r.a)(v, (function () {
                var e = this
                    , t = e.$createElement
                    , o = e._self._c || t;
                return o("div", {
                    staticClass: "form-group row"
                }, [o("label", {
                    staticClass: "col-sm-3 col-form-label"
                }, [e.label ? [e._v("\n      " + e._s(e.label) + "\n    ")] : [e._v("\n      " + e._s(e.field.name) + "\n    ")]], 2), e._v(" "), o("div", {
                    staticClass: "col-sm-9"
                }, [e.field.readonly ? [o("input", {
                    class: e.classObject,
                    attrs: {
                        type: "text",
                        readonly: ""
                    },
                    domProps: {
                        value: e.field.value
                    }
                })] : e.field.options && e.field.options.length > 0 && e.field.combo ? [o("div", {
                    staticClass: "input-group"
                }, [o("input", {
                    class: e.classObject,
                    attrs: {
                        type: "text"
                    },
                    domProps: {
                        value: e.field.value
                    },
                    on: {
                        change: e.change
                    }
                }), e._v(" "), o("div", {
                    staticClass: "input-group-append"
                }, [o("b-dropdown", {
                    attrs: {
                        text: e.field.combo,
                        size: "md",
                        variant: "outline-secondary"
                    }
                }, e._l(e.field.options, (function (t) {
                    return o("b-dropdown-item", {
                        key: t,
                        on: {
                            click: function (o) {
                                return e.update(t)
                            }
                        }
                    }, [e._v(e._s(t))])
                }
                )), 1)], 1)])] : e.field.options && e.field.options.length > 0 ? [o("select", {
                    class: e.classObject,
                    on: {
                        change: e.change
                    }
                }, [e.field.required ? e._e() : o("option", {
                    attrs: {
                        value: ""
                    }
                }), e._v(" "), e._l(e.field.options, (function (t) {
                    return o("option", {
                        key: t,
                        domProps: {
                            selected: t === e.field.value,
                            value: t
                        }
                    }, [e._v("\n          " + e._s(t) + "\n        ")])
                }
                ))], 2)] : [o("input", {
                    class: e.classObject,
                    attrs: {
                        type: "text"
                    },
                    domProps: {
                        value: e.field.value
                    },
                    on: {
                        change: e.change
                    }
                })], e._v(" "), e.field.memo ? o("small", {
                    staticClass: "form-text text-muted"
                }, [e._v("\n      " + e._s(e.field.memo) + "\n    ")]) : e._e(), e._v(" "), e._l(e.messages, (function (t) {
                    return o("div", {
                        key: t,
                        staticClass: "invalid-feedback",
                        staticStyle: {
                            display: "block"
                        }
                    }, [e._v("\n      " + e._s(t) + "\n    ")])
                }
                ))], 2)])
            }
            ), [], !1, null, null, null).exports
            , b = {
                name: "BlockForm",
                components: {
                    FieldView: g
                },
                props: {
                    node: Object
                },
                computed: {
                    style() {
                        return {
                            fields: [f.ofText("backgroundColor", this.node.style.backgroundColor), f.ofBool("separator", this.node.style.separator), f.ofText("separatorColor", this.node.style.separatorColor)]
                        }
                    }
                }
            }
            , _ = Object(r.a)(b, (function () {
                var e = this
                    , t = e.$createElement
                    , o = e._self._c || t;
                return o("div", {
                    attrs: {
                        id: "form-pane"
                    }
                }, [o("div", [o("div", [o("h4", [e._v("\n        Style\n      ")]), e._v(" "), o("div", [o("form", e._l(e.style.fields, (function (t) {
                    return o("FieldView", {
                        key: t.name,
                        attrs: {
                            id: e.node.id,
                            field: t,
                            parent: "style"
                        }
                    })
                }
                )), 1)])])])])
            }
            ), [], !1, null, null, null).exports
            , y = {
                name: "PostbackForm",
                components: {
                    FieldView: g
                },
                props: {
                    node: Object
                },
                computed: {
                    fields() {
                        return [f.ofText("label", this.node.action.label), f.ofText("data", this.node.action.data), f.ofText("displayText", this.node.action.displayText)]
                    }
                }
            }
            , x = Object(r.a)(y, (function () {
                var e = this
                    , t = e.$createElement
                    , o = e._self._c || t;
                return o("div", e._l(e.fields, (function (t) {
                    return o("FieldView", {
                        key: t.name,
                        attrs: {
                            id: e.node.id,
                            field: t,
                            parent: "action"
                        }
                    })
                }
                )), 1)
            }
            ), [], !1, null, null, null).exports
            , w = {
                name: "ObjectForm",
                components: {
                    FieldView: g
                },
                props: {
                    id: {
                        type: String,
                        required: !0
                    },
                    name: {
                        type: String,
                        required: !0
                    },
                    fields: {
                        type: Array,
                        required: !0
                    },
                    parent: {
                        type: String,
                        required: !1,
                        default: null
                    },
                    obj: {
                        type: Object,
                        required: !1,
                        default: () => { }
                    }
                },
                methods: {
                    label(e) {
                        return this.name + "." + e.name
                    },
                    change(e, t) {
                        const o = e.target.value
                            , n = Object.assign({}, this.obj);
                        null != o && o.length > 0 ? n[t.name] = t.parser(o) : delete n[t.name],
                            0 === Object.keys(n).length ? this.$store.commit("deleteProperty", {
                                id: this.id,
                                property: this.name,
                                parent: this.parent
                            }) : this.$store.commit("updateProperty", {
                                id: this.id,
                                property: this.name,
                                value: n,
                                parent: this.parent
                            })
                    }
                }
            }
            , C = {
                name: "AltUriForm",
                components: {
                    ObjectForm: Object(r.a)(w, (function () {
                        var e = this
                            , t = e.$createElement
                            , o = e._self._c || t;
                        return o("div", e._l(e.fields, (function (t) {
                            return o("FieldView", {
                                key: t.name,
                                attrs: {
                                    id: e.id,
                                    label: e.label(t),
                                    field: t
                                },
                                on: {
                                    change: function (o) {
                                        return e.change(o, t)
                                    }
                                }
                            })
                        }
                        )), 1)
                    }
                    ), [], !1, null, null, null).exports
                },
                props: {
                    id: String,
                    altUri: {
                        type: Object,
                        required: !1,
                        default: () => ({})
                    }
                },
                computed: {
                    fields() {
                        return [f.ofText("desktop", this.altUri.desktop)]
                    }
                }
            }
            , k = {
                name: "UriForm",
                components: {
                    FieldView: g,
                    AltUriForm: Object(r.a)(C, (function () {
                        var e = this.$createElement;
                        return (this._self._c || e)("ObjectForm", {
                            attrs: {
                                id: this.id,
                                name: "altUri",
                                fields: this.fields,
                                obj: this.altUri,
                                parent: "action"
                            }
                        })
                    }
                    ), [], !1, null, null, null).exports
                },
                props: {
                    node: Object
                },
                computed: {
                    fields() {
                        return [f.ofText("label", this.node.action.label), f.ofText("uri", this.node.action.uri)]
                    }
                }
            }
            , T = Object(r.a)(k, (function () {
                var e = this
                    , t = e.$createElement
                    , o = e._self._c || t;
                return o("div", [e._l(e.fields, (function (t) {
                    return o("FieldView", {
                        key: t.name,
                        attrs: {
                            id: e.node.id,
                            field: t,
                            parent: "action"
                        }
                    })
                }
                )), e._v(" "), o("AltUriForm", {
                    attrs: {
                        id: e.node.id,
                        altUri: e.node.action.altUri
                    }
                })], 2)
            }
            ), [], !1, null, null, null).exports
            , F = {
                name: "MessageForm",
                components: {
                    FieldView: g
                },
                props: {
                    node: Object
                },
                computed: {
                    fields() {
                        return [f.ofText("label", this.node.action.label), f.ofText("text", this.node.action.text)]
                    }
                }
            }
            , $ = Object(r.a)(F, (function () {
                var e = this
                    , t = e.$createElement
                    , o = e._self._c || t;
                return o("div", e._l(e.fields, (function (t) {
                    return o("FieldView", {
                        key: t.name,
                        attrs: {
                            id: e.node.id,
                            field: t,
                            parent: "action"
                        }
                    })
                }
                )), 1)
            }
            ), [], !1, null, null, null).exports
            , O = {
                name: "DateTimePicker",
                components: {
                    FieldView: g
                },
                props: {
                    node: Object
                },
                computed: {
                    fields() {
                        return [f.ofText("label", this.node.action.label), f.ofText("data", this.node.action.data), f.ofText("mode", this.node.action.mode), f.ofText("initial", this.node.action.initial), f.ofText("max", this.node.action.max), f.ofText("min", this.node.action.min)]
                    }
                }
            }
            , S = Object(r.a)(O, (function () {
                var e = this
                    , t = e.$createElement
                    , o = e._self._c || t;
                return o("div", e._l(e.fields, (function (t) {
                    return o("FieldView", {
                        key: t.name,
                        attrs: {
                            id: e.node.id,
                            field: t,
                            parent: "action"
                        }
                    })
                }
                )), 1)
            }
            ), [], !1, null, null, null).exports;
        var R = {
            of: function e(t) {
                switch (t) {
                    case "bubble":
                        return {
                            type: "bubble",
                            body: e("box")
                        };
                    case "carousel":
                        return {
                            type: "carousel",
                            contents: [e("bubble"), e("bubble")]
                        };
                    case "box":
                        return {
                            type: "box",
                            layout: "vertical",
                            contents: []
                        };
                    case "text":
                        return {
                            type: "text",
                            text: "hello, world"
                        };
                    case "span":
                        return {
                            type: "span",
                            text: "hello, world"
                        };
                    case "image":
                        return {
                            type: "image",
                            url: "https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_1_cafe.png"
                        };
                    case "video":
                        return {
                            type: "video",
                            url: "https_url_to_video",
                            previewUrl: "https_url_to_preview_image",
                            altContent: {
                                type: "image",
                                size: "full",
                                aspectRatio: "20:13",
                                aspectMode: "cover",
                                url: "https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_1_cafe.png"
                            }
                        };
                    case "button":
                        return {
                            type: "button",
                            action: e("uri")
                        };
                    case "filler":
                        return {
                            type: "filler"
                        };
                    case "icon":
                        return {
                            type: "icon",
                            url: "https://scdn.line-apps.com/n/channel_devcenter/img/fx/review_gold_star_28.png"
                        };
                    case "separator":
                        return {
                            type: "separator"
                        };
                    case "postback":
                        return {
                            type: "postback",
                            label: "action",
                            data: "hello"
                        };
                    case "message":
                        return {
                            type: "message",
                            label: "action",
                            text: "hello"
                        };
                    case "uri":
                        return {
                            type: "uri",
                            label: "action",
                            uri: "http://linecorp.com/"
                        };
                    case "datetimepicker":
                        return {
                            type: "datetimepicker",
                            label: "action",
                            data: "hello",
                            mode: "date"
                        };
                    case "linearGradient":
                        return {
                            type: "linearGradient",
                            angle: "0deg",
                            startColor: "#000000",
                            endColor: "#ffffff"
                        }
                }
                return null
            }
        }
            , I = {
                name: "ActionForm",
                components: {
                    UriActionForm: T,
                    MessageActionForm: $,
                    DateTimePickerActionForm: S,
                    PostbackActionForm: x
                },
                props: {
                    node: Object
                },
                data: function () {
                    return {
                        actionTypes: ["postback", "uri", "message", "datetimepicker"]
                    }
                },
                computed: {
                    action() {
                        return this.node.action
                    }
                },
                methods: {
                    changeAction: function (e) {
                        const t = e.target.value;
                        null != t && t.length > 0 ? this.$store.commit("updateProperty", {
                            id: this.node.id,
                            property: "action",
                            value: R.of(t)
                        }) : this.$store.commit("deleteProperty", {
                            id: this.node.id,
                            property: "action"
                        })
                    }
                }
            }
            , M = Object(r.a)(I, (function () {
                var e = this
                    , t = e.$createElement
                    , o = e._self._c || t;
                return o("div", [o("h4", [e._v("\n    Action\n  ")]), e._v(" "), o("div", [o("form", [o("div", {
                    staticClass: "form-group row"
                }, [o("label", {
                    staticClass: "col-sm-3 col-form-label"
                }, [e._v("\n          type\n        ")]), e._v(" "), o("div", {
                    staticClass: "col-sm-9"
                }, [o("select", {
                    staticClass: "form-control",
                    on: {
                        change: e.changeAction
                    }
                }, [o("option", {
                    attrs: {
                        value: ""
                    }
                }), e._v(" "), e._l(e.actionTypes, (function (t) {
                    return o("option", {
                        key: t,
                        domProps: {
                            selected: e.action && t === e.action.type,
                            value: t
                        }
                    }, [e._v("\n              " + e._s(t) + "\n            ")])
                }
                ))], 2)])]), e._v(" "), e.action && "postback" === e.action.type ? o("PostbackActionForm", {
                    attrs: {
                        node: e.node
                    }
                }) : e.action && "uri" === e.action.type ? o("UriActionForm", {
                    attrs: {
                        node: e.node
                    }
                }) : e.action && "message" === e.action.type ? o("MessageActionForm", {
                    attrs: {
                        node: e.node
                    }
                }) : e.action && "datetimepicker" === e.action.type ? o("DateTimePickerActionForm", {
                    attrs: {
                        node: e.node
                    }
                }) : e._e()], 1)])])
            }
            ), [], !1, null, null, null).exports;
        const j = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl", "3xl", "4xl", "5xl"]
            , N = ["regular", "bold"]
            , E = ["start", "end", "center"]
            , A = ["top", "bottom", "center"]
            , B = ["none", "xs", "sm", "md", "lg", "xl", "xxl"]
            , P = ["none", "xs", "sm", "md", "lg", "xl", "xxl"]
            , G = ["xs", "sm", "md", "lg", "xl", "xxl"]
            , U = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl", "3xl", "4xl", "5xl", "full"]
            , V = ["cover", "fit"]
            , D = ["ltr", "rtl"]
            , L = ["giga", "mega", "kilo", "hecto", "deca", "micro", "nano"]
            , q = ["baseline", "horizontal", "vertical"]
            , z = ["none", "light", "normal", "medium", "semi-bold", "bold"]
            , Q = ["none", "xs", "sm", "md", "lg", "xl", "xxl"]
            , H = ["link", "primary", "secondary"]
            , J = ["sm", "md"]
            , W = ["relative", "absolute"]
            , Y = ["normal", "italic"]
            , K = ["none", "underline", "line-through"]
            , X = ["center", "flex-start", "flex-end", "space-between", "space-around", "space-evenly"]
            , Z = ["center", "flex-start", "flex-end"]
            , ee = ["shrink-to-fit"]
            , te = ["none", "xs", "sm", "md", "lg", "xl", "xxl"]
            , oe = ["none", "xs", "sm", "md", "lg", "xl", "xxl"];
        var ne = {
            name: "OffsetForm",
            components: {
                FieldView: g
            },
            props: {
                node: Object
            },
            computed: {
                fields() {
                    return [f.ofText("offsetTop", this.node.offsetTop, {
                        combo: "px, % or keywords",
                        options: te
                    }), f.ofText("offsetBottom", this.node.offsetBottom, {
                        combo: "px, % or keywords",
                        options: te
                    }), f.ofText("offsetStart", this.node.offsetStart, {
                        combo: "px, % or keywords",
                        options: te
                    }), f.ofText("offsetEnd", this.node.offsetEnd, {
                        combo: "px, % or keywords",
                        options: te
                    })]
                }
            }
        }
            , se = Object(r.a)(ne, (function () {
                var e = this
                    , t = e.$createElement
                    , o = e._self._c || t;
                return o("div", [o("h4", [e._v("\n    Offset\n  ")]), e._v(" "), o("div", [o("form", e._l(e.fields, (function (t) {
                    return o("FieldView", {
                        key: t.name,
                        attrs: {
                            id: e.node.id,
                            field: t
                        }
                    })
                }
                )), 1)])])
            }
            ), [], !1, null, null, null).exports
            , ie = {
                name: "PaddingForm",
                components: {
                    FieldView: g
                },
                props: {
                    node: Object
                },
                computed: {
                    fields() {
                        return [f.ofText("paddingAll", this.node.paddingAll, {
                            combo: "px, % or keywords",
                            options: oe
                        }), f.ofText("paddingTop", this.node.paddingTop, {
                            combo: "px, % or keywords",
                            options: oe
                        }), f.ofText("paddingBottom", this.node.paddingBottom, {
                            combo: "px, % or keywords",
                            options: oe
                        }), f.ofText("paddingStart", this.node.paddingStart, {
                            combo: "px, % or keywords",
                            options: oe
                        }), f.ofText("paddingEnd", this.node.paddingEnd, {
                            combo: "px, % or keywords",
                            options: oe
                        })]
                    }
                }
            }
            , re = Object(r.a)(ie, (function () {
                var e = this
                    , t = e.$createElement
                    , o = e._self._c || t;
                return o("div", [o("h4", [e._v("\n    Padding\n  ")]), e._v(" "), o("div", [o("form", e._l(e.fields, (function (t) {
                    return o("FieldView", {
                        key: t.name,
                        attrs: {
                            id: e.node.id,
                            field: t
                        }
                    })
                }
                )), 1)])])
            }
            ), [], !1, null, null, null).exports
            , ae = {
                name: "LinearGradientForm",
                components: {
                    FieldView: g
                },
                props: {
                    node: Object
                },
                computed: {
                    fields() {
                        return [f.ofText("angle", this.node.background.angle), f.ofText("startColor", this.node.background.startColor, {
                            memo: "#RRGGBB or #RRGGBBAA"
                        }), f.ofText("endColor", this.node.background.endColor, {
                            memo: "#RRGGBB or #RRGGBBAA"
                        }), f.ofText("centerColor", this.node.background.centerColor, {
                            memo: "#RRGGBB or #RRGGBBAA"
                        }), f.ofText("centerPosition", this.node.background.centerPosition)]
                    }
                }
            }
            , le = {
                name: "BackgroundForm",
                components: {
                    LinearGradientForm: Object(r.a)(ae, (function () {
                        var e = this
                            , t = e.$createElement
                            , o = e._self._c || t;
                        return o("div", e._l(e.fields, (function (t) {
                            return o("FieldView", {
                                key: t.name,
                                attrs: {
                                    id: e.node.id,
                                    field: t,
                                    parent: "background"
                                }
                            })
                        }
                        )), 1)
                    }
                    ), [], !1, null, null, null).exports
                },
                props: {
                    node: Object
                },
                data: function () {
                    return {
                        backgroundTypes: ["linearGradient"]
                    }
                },
                computed: {
                    background() {
                        return this.node.background
                    }
                },
                methods: {
                    changeBackground: function (e) {
                        const t = e.target.value;
                        null != t && t.length > 0 ? this.$store.commit("updateProperty", {
                            id: this.node.id,
                            property: "background",
                            value: R.of(t)
                        }) : this.$store.commit("deleteProperty", {
                            id: this.node.id,
                            property: "background"
                        })
                    }
                }
            }
            , de = {
                name: "BoxForm",
                components: {
                    BackgroundForm: Object(r.a)(le, (function () {
                        var e = this
                            , t = e.$createElement
                            , o = e._self._c || t;
                        return o("div", [o("h4", [e._v("\n    Background\n  ")]), e._v(" "), o("div", [o("form", [o("div", {
                            staticClass: "form-group row"
                        }, [o("label", {
                            staticClass: "col-sm-3 col-form-label"
                        }, [e._v("\n          type\n        ")]), e._v(" "), o("div", {
                            staticClass: "col-sm-9"
                        }, [o("select", {
                            staticClass: "form-control",
                            on: {
                                change: e.changeBackground
                            }
                        }, [o("option", {
                            attrs: {
                                value: ""
                            }
                        }), e._v(" "), e._l(e.backgroundTypes, (function (t) {
                            return o("option", {
                                key: t,
                                domProps: {
                                    selected: e.background && t === e.background.type,
                                    value: t
                                }
                            }, [e._v("\n              " + e._s(t) + "\n            ")])
                        }
                        ))], 2)])]), e._v(" "), e.background && "linearGradient" === e.background.type ? o("LinearGradientForm", {
                            attrs: {
                                node: e.node
                            }
                        }) : e._e()], 1)])])
                    }
                    ), [], !1, null, null, null).exports,
                    FieldView: g,
                    ActionForm: M,
                    OffsetForm: se,
                    PaddingForm: re
                },
                props: {
                    node: Object
                },
                computed: {
                    fields() {
                        return [f.ofText("type", "box", {
                            readonly: !0
                        }), f.ofText("layout", this.node.layout, {
                            required: !0,
                            options: q
                        }), f.ofText("position", this.node.position, {
                            options: W
                        }), f.ofNumber("flex", this.node.flex), f.ofText("spacing", this.node.spacing, {
                            combo: "px or keywords",
                            options: P
                        }), f.ofText("margin", this.node.margin, {
                            combo: "px or keywords",
                            options: B
                        }), f.ofText("width", this.node.width), f.ofText("height", this.node.height), f.ofText("maxWidth", this.node.maxWidth), f.ofText("maxHeight", this.node.maxHeight), f.ofText("backgroundColor", this.node.backgroundColor, {
                            memo: "#RRGGBB or #RRGGBBAA"
                        }), f.ofText("borderWidth", this.node.borderWidth, {
                            combo: "px or keywords",
                            options: z
                        }), f.ofText("borderColor", this.node.borderColor, {
                            memo: "#RRGGBB or #RRGGBBAA"
                        }), f.ofText("cornerRadius", this.node.cornerRadius, {
                            combo: "px or keywords",
                            options: Q
                        }), f.ofText("justifyContent", this.node.justifyContent, {
                            options: X
                        }), f.ofText("alignItems", this.node.alignItems, {
                            options: Z
                        })]
                    }
                }
            }
            , ce = Object(r.a)(de, (function () {
                var e = this
                    , t = e.$createElement
                    , o = e._self._c || t;
                return o("div", {
                    attrs: {
                        id: "form-pane"
                    }
                }, [o("div", [o("div", [o("h1", [e._v("\n        Box\n      ")]), e._v(" "), o("div", [o("form", e._l(e.fields, (function (t) {
                    return o("FieldView", {
                        key: t.name,
                        attrs: {
                            id: e.node.id,
                            field: t
                        }
                    })
                }
                )), 1)])]), e._v(" "), o("hr"), e._v(" "), o("OffsetForm", {
                    attrs: {
                        node: e.node
                    }
                }), e._v(" "), o("hr"), e._v(" "), o("PaddingForm", {
                    attrs: {
                        node: e.node
                    }
                }), e._v(" "), o("hr"), e._v(" "), o("BackgroundForm", {
                    attrs: {
                        node: e.node
                    }
                }), e._v(" "), o("hr"), e._v(" "), o("ActionForm", {
                    attrs: {
                        node: e.node
                    }
                })], 1)])
            }
            ), [], !1, null, null, null).exports
            , ue = {
                name: "TextForm",
                components: {
                    FieldView: g,
                    ActionForm: M,
                    OffsetForm: se
                },
                props: {
                    node: Object
                },
                computed: {
                    fields() {
                        return [f.ofText("type", "text", {
                            readonly: !0
                        }), f.ofText("text", this.node.text, {
                            required: !0,
                            newline: !0
                        }), f.ofNumber("flex", this.node.flex), f.ofText("margin", this.node.margin, {
                            combo: "px or keywords",
                            options: B
                        }), f.ofText("size", this.node.size, {
                            combo: "px or keywords",
                            options: j
                        }), f.ofText("lineSpacing", this.node.lineSpacing), f.ofText("color", this.node.color, {
                            memo: "#RRGGBB or #RRGGBBAA"
                        }), f.ofText("weight", this.node.weight, {
                            options: N
                        }), f.ofText("style", this.node.style, {
                            options: Y
                        }), f.ofText("decoration", this.node.decoration, {
                            options: K
                        }), f.ofText("position", this.node.position, {
                            options: W
                        }), f.ofText("align", this.node.align, {
                            options: E
                        }), f.ofText("gravity", this.node.gravity, {
                            options: A
                        }), f.ofBool("wrap", this.node.wrap), f.ofBool("scaling", this.node.scaling), f.ofNumber("maxLines", this.node.maxLines, {
                            memo: "`maxLines` is not supported in simulator"
                        }), f.ofText("adjustMode", this.node.adjustMode, {
                            options: ee,
                            memo: "`adjustMode` is not supported in simulator"
                        })]
                    }
                }
            }
            , pe = Object(r.a)(ue, (function () {
                var e = this
                    , t = e.$createElement
                    , o = e._self._c || t;
                return o("div", {
                    attrs: {
                        id: "form-pane"
                    }
                }, [o("div", [o("div", [o("h1", [e._v("\n        Text\n      ")]), e._v(" "), o("div", [o("form", e._l(e.fields, (function (t) {
                    return o("FieldView", {
                        key: t.name,
                        attrs: {
                            id: e.node.id,
                            field: t
                        }
                    })
                }
                )), 1)])]), e._v(" "), o("hr"), e._v(" "), o("OffsetForm", {
                    attrs: {
                        node: e.node
                    }
                }), e._v(" "), o("hr"), e._v(" "), o("ActionForm", {
                    attrs: {
                        node: e.node
                    }
                })], 1)])
            }
            ), [], !1, null, null, null).exports
            , me = {
                name: "ImageForm",
                components: {
                    FieldView: g,
                    ActionForm: M,
                    OffsetForm: se
                },
                props: {
                    node: Object
                },
                computed: {
                    fields() {
                        return [f.ofText("type", "image", {
                            readonly: !0
                        }), f.ofNumber("flex", this.node.flex), f.ofText("position", this.node.position, {
                            options: W
                        }), f.ofText("url", this.node.url, {
                            required: !0
                        }), f.ofText("margin", this.node.margin, {
                            combo: "px or keywords",
                            options: B
                        }), f.ofText("align", this.node.align, {
                            options: E
                        }), f.ofText("gravity", this.node.gravity, {
                            options: A
                        }), f.ofText("size", this.node.size, {
                            combo: "px, % or keywords",
                            options: U
                        }), f.ofText("aspectRatio", this.node.aspectRatio), f.ofText("aspectMode", this.node.aspectMode, {
                            options: V
                        }), f.ofText("backgroundColor", this.node.backgroundColor, {
                            memo: "#RRGGBB or #RRGGBBAA"
                        }), f.ofBool("animated", this.node.animated)]
                    }
                }
            }
            , he = Object(r.a)(me, (function () {
                var e = this
                    , t = e.$createElement
                    , o = e._self._c || t;
                return o("div", {
                    attrs: {
                        id: "form-pane"
                    }
                }, [o("div", [o("div", [o("h1", [e._v("\n        Image\n      ")]), e._v(" "), o("div", [o("form", e._l(e.fields, (function (t) {
                    return o("FieldView", {
                        key: t.name,
                        attrs: {
                            id: e.node.id,
                            field: t
                        }
                    })
                }
                )), 1)])]), e._v(" "), o("hr"), e._v(" "), o("OffsetForm", {
                    attrs: {
                        node: e.node
                    }
                }), e._v(" "), o("hr"), e._v(" "), o("ActionForm", {
                    attrs: {
                        node: e.node
                    }
                })], 1)])
            }
            ), [], !1, null, null, null).exports
            , fe = {
                name: "VideoForm",
                components: {
                    FieldView: g,
                    ActionForm: M
                },
                props: {
                    node: Object
                },
                computed: {
                    fields() {
                        return [f.ofText("url", this.node.url, {
                            required: !0
                        }), f.ofText("previewUrl", this.node.previewUrl, {
                            required: !0
                        }), f.ofText("aspectRatio", this.node.aspectRatio)]
                    }
                }
            }
            , ve = Object(r.a)(fe, (function () {
                var e = this
                    , t = e.$createElement
                    , o = e._self._c || t;
                return o("div", {
                    attrs: {
                        id: "form-pane"
                    }
                }, [o("div", [o("div", [o("h1", [e._v("\n        Video\n      ")]), e._v(" "), o("div", [e._m(0), e._v(" "), o("form", e._l(e.fields, (function (t) {
                    return o("FieldView", {
                        key: t.name,
                        attrs: {
                            id: e.node.id,
                            field: t
                        }
                    })
                }
                )), 1)])]), e._v(" "), o("hr"), e._v(" "), o("ActionForm", {
                    attrs: {
                        node: e.node
                    }
                })], 1)])
            }
            ), [function () {
                var e = this.$createElement
                    , t = this._self._c || e;
                return t("div", {
                    staticClass: "alert alert-warning"
                }, [this._v("\n          - Video is not shown in simulator. Instead, you'll see alternative content (altContent)\n          "), t("br"), this._v("\n          - You can configure altContent by adding/removing the child node of the video\n        ")])
            }
            ], !1, null, null, null).exports
            , ge = {
                name: "IconForm",
                components: {
                    FieldView: g,
                    OffsetForm: se
                },
                props: {
                    node: Object
                },
                computed: {
                    fields() {
                        return [f.ofText("type", "icon", {
                            readonly: !0
                        }), f.ofText("position", this.node.position, {
                            options: W
                        }), f.ofText("url", this.node.url, {
                            required: !0
                        }), f.ofText("margin", this.node.margin, {
                            combo: "px or keywords",
                            options: B
                        }), f.ofText("size", this.node.size, {
                            combo: "px or keywords",
                            options: j
                        }), f.ofBool("scaling", this.node.scaling), f.ofText("aspectRatio", this.node.aspectRatio)]
                    }
                }
            }
            , be = Object(r.a)(ge, (function () {
                var e = this
                    , t = e.$createElement
                    , o = e._self._c || t;
                return o("div", {
                    attrs: {
                        id: "form-pane"
                    }
                }, [o("div", [o("div", [o("h1", [e._v("\n        Icon\n      ")]), e._v(" "), o("div", [o("form", e._l(e.fields, (function (t) {
                    return o("FieldView", {
                        key: t.name,
                        attrs: {
                            id: e.node.id,
                            field: t
                        }
                    })
                }
                )), 1)])]), e._v(" "), o("hr"), e._v(" "), o("OffsetForm", {
                    attrs: {
                        node: e.node
                    }
                })], 1)])
            }
            ), [], !1, null, null, null).exports
            , _e = {
                name: "SeparatorForm",
                components: {
                    FieldView: g
                },
                props: {
                    node: Object
                },
                computed: {
                    fields() {
                        return [f.ofText("type", "separator", {
                            readonly: !0
                        }), f.ofText("margin", this.node.margin, {
                            combo: "px or keywords",
                            options: B
                        }), f.ofText("color", this.node.color, {
                            memo: "#RRGGBB or #RRGGBBAA"
                        })]
                    }
                }
            }
            , ye = Object(r.a)(_e, (function () {
                var e = this
                    , t = e.$createElement
                    , o = e._self._c || t;
                return o("div", {
                    attrs: {
                        id: "form-pane"
                    }
                }, [o("div", [o("div", [o("h1", [e._v("\n        Separator\n      ")]), e._v(" "), o("div", [o("form", e._l(e.fields, (function (t) {
                    return o("FieldView", {
                        key: t.name,
                        attrs: {
                            id: e.node.id,
                            field: t
                        }
                    })
                }
                )), 1)])])])])
            }
            ), [], !1, null, null, null).exports
            , xe = {
                name: "FillerForm",
                components: {
                    FieldView: g
                },
                props: {
                    node: Object
                },
                computed: {
                    fields() {
                        return [f.ofText("type", "filler", {
                            readonly: !0
                        }), f.ofNumber("flex", this.node.flex)]
                    }
                }
            }
            , we = Object(r.a)(xe, (function () {
                var e = this
                    , t = e.$createElement
                    , o = e._self._c || t;
                return o("div", {
                    attrs: {
                        id: "form-pane"
                    }
                }, [o("div", [o("div", [o("h1", [e._v("\n        Filler\n      ")]), e._v(" "), o("div", [o("form", e._l(e.fields, (function (t) {
                    return o("FieldView", {
                        key: t.name,
                        attrs: {
                            id: e.node.id,
                            field: t
                        }
                    })
                }
                )), 1)])])])])
            }
            ), [], !1, null, null, null).exports
            , Ce = {
                name: "SpacerForm",
                components: {
                    FieldView: g
                },
                props: {
                    node: Object
                },
                computed: {
                    fields() {
                        return [f.ofText("type", "spacer", {
                            readonly: !0
                        }), f.ofText("size", this.node.size, {
                            options: G
                        })]
                    }
                }
            }
            , ke = Object(r.a)(Ce, (function () {
                var e = this
                    , t = e.$createElement
                    , o = e._self._c || t;
                return o("div", {
                    attrs: {
                        id: "form-pane"
                    }
                }, [o("div", [o("div", [o("h1", [e._v("\n        Spacer\n      ")]), e._v(" "), o("div", {
                    staticClass: "alert alert-danger"
                }, [e._v("\n        Spacer is no longer supported and will be removed in a future version.\n      ")]), e._v(" "), o("div", [o("form", e._l(e.fields, (function (t) {
                    return o("FieldView", {
                        key: t.name,
                        attrs: {
                            id: e.node.id,
                            field: t
                        }
                    })
                }
                )), 1)])])])])
            }
            ), [], !1, null, null, null).exports
            , Te = {
                name: "ButtonForm",
                components: {
                    FieldView: g,
                    ActionForm: M,
                    OffsetForm: se
                },
                props: {
                    node: Object
                },
                computed: {
                    fields() {
                        return [f.ofText("type", "button", {
                            readonly: !0
                        }), f.ofNumber("flex", this.node.flex), f.ofText("position", this.node.position, {
                            options: W
                        }), f.ofText("margin", this.node.margin, {
                            combo: "px or keywords",
                            options: B
                        }), f.ofText("height", this.node.height, {
                            options: J
                        }), f.ofText("style", this.node.style, {
                            options: H
                        }), f.ofText("color", this.node.color, {
                            memo: "#RRGGBB or #RRGGBBAA"
                        }), f.ofText("gravity", this.node.gravity, {
                            options: A
                        }), f.ofBool("scaling", this.node.scaling), f.ofText("adjustMode", this.node.adjustMode, {
                            options: ee,
                            memo: "`adjustMode` is not supported in simulator"
                        })]
                    }
                }
            }
            , Fe = Object(r.a)(Te, (function () {
                var e = this
                    , t = e.$createElement
                    , o = e._self._c || t;
                return o("div", {
                    attrs: {
                        id: "form-pane"
                    }
                }, [o("div", [o("div", [o("h1", [e._v("\n        Button\n      ")]), e._v(" "), o("div", [o("form", e._l(e.fields, (function (t) {
                    return o("FieldView", {
                        key: t.name,
                        attrs: {
                            id: e.node.id,
                            field: t
                        }
                    })
                }
                )), 1)])]), e._v(" "), o("hr"), e._v(" "), o("OffsetForm", {
                    attrs: {
                        node: e.node
                    }
                }), e._v(" "), o("hr"), e._v(" "), o("ActionForm", {
                    attrs: {
                        node: e.node
                    }
                })], 1)])
            }
            ), [], !1, null, null, null).exports
            , $e = {
                name: "BubbleForm",
                components: {
                    FieldView: g,
                    ActionForm: M
                },
                props: {
                    node: Object
                },
                computed: {
                    fields() {
                        return [f.ofText("type", "bubble", {
                            readonly: !0
                        }), f.ofText("direction", this.node.direction, {
                            options: D
                        }), f.ofText("size", this.node.size, {
                            options: L
                        })]
                    }
                }
            }
            , Oe = Object(r.a)($e, (function () {
                var e = this
                    , t = e.$createElement
                    , o = e._self._c || t;
                return o("div", {
                    attrs: {
                        id: "form-pane"
                    }
                }, [o("div", [o("div", [o("h1", [e._v("\n        Bubble\n      ")]), e._v(" "), o("div", [o("form", e._l(e.fields, (function (t) {
                    return o("FieldView", {
                        key: t.name,
                        attrs: {
                            id: e.node.id,
                            field: t
                        }
                    })
                }
                )), 1)])]), e._v(" "), o("ActionForm", {
                    attrs: {
                        node: e.node
                    }
                })], 1)])
            }
            ), [], !1, null, null, null).exports
            , Se = {
                name: "CarouselForm",
                components: {
                    FieldView: g
                },
                props: {
                    node: Object
                },
                computed: {
                    fields: () => [f.ofText("type", "carousel", {
                        readonly: !0
                    })]
                }
            }
            , Re = Object(r.a)(Se, (function () {
                var e = this
                    , t = e.$createElement
                    , o = e._self._c || t;
                return o("div", {
                    attrs: {
                        id: "form-pane"
                    }
                }, [o("div", [o("div", [o("h1", [e._v("\n        Carousel\n      ")]), e._v(" "), o("div", [o("form", e._l(e.fields, (function (t) {
                    return o("FieldView", {
                        key: t.name,
                        attrs: {
                            id: e.node.id,
                            field: t
                        }
                    })
                }
                )), 1)])])])])
            }
            ), [], !1, null, null, null).exports
            , Ie = {
                name: "SpanForm",
                components: {
                    FieldView: g
                },
                props: {
                    node: Object
                },
                computed: {
                    fields() {
                        return [f.ofText("type", "span", {
                            readonly: !0
                        }), f.ofText("text", this.node.text, {
                            required: !0,
                            newline: !0
                        }), f.ofText("size", this.node.size, {
                            combo: "px or keywords",
                            options: j
                        }), f.ofText("color", this.node.color, {
                            memo: "#RRGGBB or #RRGGBBAA"
                        }), f.ofText("weight", this.node.weight, {
                            options: N
                        }), f.ofText("style", this.node.style, {
                            options: Y
                        }), f.ofText("decoration", this.node.decoration, {
                            options: K
                        })]
                    }
                }
            }
            , Me = {
                name: "FormPane",
                components: {
                    ButtonForm: Fe,
                    BubbleForm: Oe,
                    CarouselForm: Re,
                    BlockForm: _,
                    BoxForm: ce,
                    TextForm: pe,
                    ImageForm: he,
                    VideoForm: ve,
                    IconForm: be,
                    SeparatorForm: ye,
                    FillerForm: we,
                    SpacerForm: ke,
                    SpanForm: Object(r.a)(Ie, (function () {
                        var e = this
                            , t = e.$createElement
                            , o = e._self._c || t;
                        return o("div", {
                            attrs: {
                                id: "form-pane"
                            }
                        }, [o("div", [o("div", [o("h1", [e._v("\n        Span\n      ")]), e._v(" "), o("div", [o("form", e._l(e.fields, (function (t) {
                            return o("FieldView", {
                                key: t.name,
                                attrs: {
                                    id: e.node.id,
                                    field: t
                                }
                            })
                        }
                        )), 1)])])])])
                    }
                    ), [], !1, null, null, null).exports
                },
                computed: {
                    node() {
                        return this.$store.getters.getSelectedNode
                    }
                }
            }
            , je = Object(r.a)(Me, (function () {
                var e = this
                    , t = e.$createElement
                    , o = e._self._c || t;
                return e.node && "header" === e.node.type || e.node && "hero" === e.node.type || e.node && "body" === e.node.type || e.node && "footer" === e.node.type ? o("BlockForm", {
                    attrs: {
                        node: e.node
                    }
                }) : e.node && "box" === e.node.type ? o("BoxForm", {
                    attrs: {
                        node: e.node
                    }
                }) : e.node && "bubble" === e.node.type ? o("BubbleForm", {
                    attrs: {
                        node: e.node
                    }
                }) : e.node && "carousel" === e.node.type ? o("CarouselForm", {
                    attrs: {
                        node: e.node
                    }
                }) : e.node && "button" === e.node.type ? o("ButtonForm", {
                    attrs: {
                        node: e.node
                    }
                }) : e.node && "filler" === e.node.type ? o("FillerForm", {
                    attrs: {
                        node: e.node
                    }
                }) : e.node && "icon" === e.node.type ? o("IconForm", {
                    attrs: {
                        node: e.node
                    }
                }) : e.node && "image" === e.node.type ? o("ImageForm", {
                    attrs: {
                        node: e.node
                    }
                }) : e.node && "video" === e.node.type ? o("VideoForm", {
                    attrs: {
                        node: e.node
                    }
                }) : e.node && "separator" === e.node.type ? o("SeparatorForm", {
                    attrs: {
                        node: e.node
                    }
                }) : e.node && "spacer" === e.node.type ? o("SpacerForm", {
                    attrs: {
                        node: e.node
                    }
                }) : e.node && "text" === e.node.type ? o("TextForm", {
                    attrs: {
                        node: e.node
                    }
                }) : e.node && "span" === e.node.type ? o("SpanForm", {
                    attrs: {
                        node: e.node
                    }
                }) : o("div", {
                    attrs: {
                        id: "form-pane"
                    }
                })
            }
            ), [], !1, null, null, null).exports
            , Ne = {
                name: "CommandPane",
                computed: {
                    id() {
                        return this.$store.getters.getSelectedNodeId
                    },
                    ids() {
                        return this.$store.getters.getMultiSelectedNodeIds
                    },
                    singleSelectionMode() {
                        return this.node && 1 === this.ids.length
                    },
                    node() {
                        const e = this.$store.getters.getSelectedNode;
                        return e ? d.of(e) : null
                    },
                    nodes() {
                        return this.ids.map(e => this.$store.getters.getById(e)).map(e => d.of(e))
                    },
                    clipboard() {
                        return this.$store.getters.getClipboard
                    },
                    isRemovable() {
                        return this.nodes && this.nodes.every(e => e.isRemovable)
                    },
                    isAddable() {
                        return this.singleSelectionMode && this.node.isAddable
                    },
                    addableTypes() {
                        return this.node && this.node.addableTypes
                    },
                    canCopy() {
                        return this.nodes && this.nodes.every(e => e.canCopy)
                    },
                    canCut() {
                        return this.nodes && this.nodes.every(e => e.canCopy && e.isRemovable)
                    },
                    canPaste() {
                        return !!(this.singleSelectionMode && this.node.isAddable && this.clipboard.length > 0) && this.clipboard.every(e => this.node.addableTypes.includes(e.type))
                    },
                    canMove() {
                        return this.singleSelectionMode && this.node.canMove
                    },
                    canUndo() {
                        return this.$store.getters.canUndo
                    },
                    canRedo() {
                        return this.$store.getters.canRedo
                    }
                },
                methods: {
                    removeNode() {
                        this.$store.commit("removeNode", {
                            ids: this.ids
                        })
                    },
                    addNode(e) {
                        this.$store.commit("addNode", {
                            parentId: this.id,
                            type: e
                        })
                    },
                    move(e) {
                        this.$store.commit("move", {
                            id: this.id,
                            direction: e
                        })
                    },
                    copy() {
                        this.$store.commit("copyNode", {
                            ids: this.ids
                        })
                    },
                    cut() {
                        this.$store.commit("cutNode", {
                            ids: this.ids
                        })
                    },
                    paste() {
                        this.$store.commit("pasteNode", {
                            parentId: this.id
                        })
                    },
                    undo() {
                        this.$store.commit("undo")
                    },
                    redo() {
                        this.$store.commit("redo")
                    }
                }
            }
            , Ee = Object(r.a)(Ne, (function () {
                var e = this
                    , t = e.$createElement
                    , o = e._self._c || t;
                return o("div", {
                    attrs: {
                        id: "command-pane"
                    }
                }, [o("b-dropdown", {
                    attrs: {
                        size: "sm",
                        variant: "primary",
                        disabled: !e.isAddable
                    }
                }, [o("template", {
                    slot: "button-content"
                }, [o("i", {
                    staticClass: "fa fa-plus"
                })]), e._v(" "), e._l(e.addableTypes, (function (t) {
                    return o("b-dropdown-item", {
                        key: t,
                        on: {
                            click: function (o) {
                                return e.addNode(t)
                            }
                        }
                    }, [e._v("\n      " + e._s(t) + "\n    ")])
                }
                ))], 2), e._v(" "), o("div", {
                    staticClass: "btn-group btn-group-sm"
                }, [o("button", {
                    staticClass: "btn btn-secondary",
                    attrs: {
                        type: "button",
                        disabled: !e.canMove
                    },
                    on: {
                        click: function (t) {
                            return e.move(-1)
                        }
                    }
                }, [o("i", {
                    staticClass: "fa fa-chevron-up"
                })]), e._v(" "), o("button", {
                    staticClass: "btn btn-secondary",
                    attrs: {
                        type: "button",
                        disabled: !e.canMove
                    },
                    on: {
                        click: function (t) {
                            return e.move(1)
                        }
                    }
                }, [o("i", {
                    staticClass: "fa fa-chevron-down"
                })])]), e._v(" "), o("div", {
                    staticClass: "btn-group btn-group-sm"
                }, [o("button", {
                    staticClass: "btn btn-secondary",
                    attrs: {
                        type: "button",
                        disabled: !e.canCopy
                    },
                    on: {
                        click: e.copy
                    }
                }, [o("i", {
                    staticClass: "fa fa-files-o"
                })]), e._v(" "), o("button", {
                    staticClass: "btn btn-secondary",
                    attrs: {
                        type: "button",
                        disabled: !e.canCut
                    },
                    on: {
                        click: e.cut
                    }
                }, [o("i", {
                    staticClass: "fa fa-scissors"
                })]), e._v(" "), o("button", {
                    staticClass: "btn btn-secondary",
                    attrs: {
                        type: "button",
                        disabled: !e.canPaste
                    },
                    on: {
                        click: e.paste
                    }
                }, [o("i", {
                    staticClass: "fa fa-clipboard"
                })])]), e._v(" "), o("div", {
                    staticClass: "btn-group btn-group-sm"
                }, [o("button", {
                    staticClass: "btn btn-secondary",
                    attrs: {
                        type: "button",
                        disabled: !e.canUndo
                    },
                    on: {
                        click: e.undo
                    }
                }, [o("i", {
                    staticClass: "fa fa-undo"
                })]), e._v(" "), o("button", {
                    staticClass: "btn btn-secondary",
                    attrs: {
                        type: "button",
                        disabled: !e.canRedo
                    },
                    on: {
                        click: e.redo
                    }
                }, [o("i", {
                    staticClass: "fa fa-repeat"
                })])]), e._v(" "), o("div", {
                    staticClass: "btn-group btn-group-sm"
                }, [o("button", {
                    staticClass: "btn btn-danger",
                    attrs: {
                        type: "button",
                        disabled: !e.isRemovable
                    },
                    on: {
                        click: e.removeNode
                    }
                }, [o("i", {
                    staticClass: "fa fa-times"
                })])])], 1)
            }
            ), [], !1, null, null, null).exports
            , Ae = [function () {
                var e = this.$createElement
                    , t = this._self._c || e;
                return t("div", {
                    staticClass: "logo"
                }, [t("img", {
                    attrs: {
                        src: o(46)
                    }
                })])
            }
            ]
            , Be = {
                name: "EditorModal",
                props: {
                    value: Boolean
                },
                data: () => ({
                    show: !1,
                    json: ""
                }),
                computed: {
                    flex() {
                        return this.$store.getters.getAsFlex
                    }
                },
                watch: {
                    value(e) {
                        this.show = e
                    },
                    show(e) {
                        this.$emit("input", e)
                    },
                    flex() {
                        this.reset()
                    }
                },
                methods: {
                    change(e) {
                        this.json = e
                    },
                    reset() {
                        const e = this.$store.getters.getAsFlex;
                        this.json = null !== e ? JSON.stringify(e, null, "  ") : ""
                    },
                    copy() {
                        const e = document.querySelector("#editor");
                        e.select(),
                            document.execCommand("copy"),
                            e.blur(),
                            this.$refs.tooltipCopied.$emit("open");
                        const t = this.$refs.tooltipCopied;
                        setTimeout((function () {
                            t.$emit("close")
                        }
                        ), 2e3)
                    },
                    close() {
                        this.show = !1,
                            this.reset()
                    },
                    apply() {
                        try {
                            this.$store.commit("initTree", JSON.parse(this.json))
                        } catch (e) {
                            this.$store.commit("setMessages", [{
                                text: "invalid json",
                                level: "error"
                            }]),
                                console.error(e)
                        }
                        this.show = !1
                    }
                }
            }
            , Pe = Object(r.a)(Be, (function () {
                var e = this
                    , t = e.$createElement
                    , o = e._self._c || t;
                return o("b-modal", {
                    attrs: {
                        size: "lg",
                        "hide-header": !0,
                        "no-fade": !0,
                        title: "JSON"
                    },
                    model: {
                        value: e.show,
                        callback: function (t) {
                            e.show = t
                        },
                        expression: "show"
                    }
                }, [o("form", [o("textarea", {
                    attrs: {
                        id: "editor"
                    },
                    domProps: {
                        value: e.json
                    },
                    on: {
                        change: function (t) {
                            return e.change(t.target.value)
                        }
                    }
                })]), e._v(" "), o("div", [o("a", {
                    staticClass: "link-json-spec",
                    attrs: {
                        href: "https://developers.line.biz/" + e.$i18n.locale + "/docs/messaging-api/using-flex-messages/",
                        target: "_blank"
                    }
                }, [e._v(e._s(e.$t("json_spec")) + "\n    ")])]), e._v(" "), o("div", {
                    attrs: {
                        slot: "modal-footer"
                    },
                    slot: "modal-footer"
                }, [o("button", {
                    staticClass: "btn btn-outline-primary",
                    attrs: {
                        type: "button",
                        id: "copyButton"
                    },
                    on: {
                        click: e.copy
                    }
                }, [e._v("\n      " + e._s(e.$t("copy")) + "\n    ")]), e._v(" "), o("b-tooltip", {
                    ref: "tooltipCopied",
                    attrs: {
                        target: "copyButton",
                        triggers: ""
                    }
                }, [o("strong", [e._v(e._s(e.$t("copied")))])]), e._v(" "), o("button", {
                    staticClass: "btn btn-secondary",
                    attrs: {
                        type: "button"
                    },
                    on: {
                        click: e.close
                    }
                }, [e._v("\n      " + e._s(e.$t("close")) + "\n    ")]), e._v(" "), o("button", {
                    staticClass: "btn btn-primary",
                    attrs: {
                        type: "button"
                    },
                    on: {
                        click: e.apply
                    }
                }, [e._v("\n      " + e._s(e.$t("apply")) + "\n    ")])], 1)])
            }
            ), [], !1, null, null, null).exports
            , Ge = {
                name: "HeaderPane",
                components: {
                    EditorModal: Pe
                },
                data: () => ({
                    locale: "en",
                    showEditorModal: !1
                }),
                computed: {
                    samples() {
                        return this.$store.state.samples
                    }
                },
                methods: {
                    reset(e) {
                        this.$store.dispatch("doReset", e)
                    },
                    doLoadSample(e) {
                        this.$store.dispatch("doLoadSample", e)
                    },
                    openEditor() {
                        this.showEditorModal = !0
                    }
                },
                watch: {
                    locale(e) {
                        this.$i18n.locale = e
                    }
                }
            }
            , Ue = (o(47),
                Object(r.a)(Ge, (function () {
                    var e = this
                        , t = e.$createElement
                        , o = e._self._c || t;
                    return o("div", {
                        staticClass: "header-root"
                    }, [e._m(0), e._v(" "), o("a", {
                        staticClass: "link-to-top-page",
                        attrs: {
                            href: "/"
                        }
                    }, [e._v(e._s(e.$t("back_to_home")))]), e._v(" "), o("div", {
                        staticClass: "language-selector"
                    }, [o("select", {
                        directives: [{
                            name: "model",
                            rawName: "v-model",
                            value: e.locale,
                            expression: "locale"
                        }],
                        on: {
                            change: function (t) {
                                var o = Array.prototype.filter.call(t.target.options, (function (e) {
                                    return e.selected
                                }
                                )).map((function (e) {
                                    return "_value" in e ? e._value : e.value
                                }
                                ));
                                e.locale = t.target.multiple ? o : o[0]
                            }
                        }
                    }, [o("option", {
                        attrs: {
                            value: "ja"
                        }
                    }, [e._v("日本語")]), e._v(" "), o("option", {
                        attrs: {
                            value: "en"
                        }
                    }, [e._v("English")])])])])
                }
                ), Ae, !1, null, "7e1dc84b", null).exports)
            , Ve = {
                name: "ShowcaseModal",
                props: {
                    value: Boolean
                },
                data: () => ({
                    show: !1,
                    selectedSampleId: ""
                }),
                computed: {
                    samples() {
                        return this.$store.state.samples
                    }
                },
                watch: {
                    value(e) {
                        this.show = e
                    },
                    show(e) {
                        this.$emit("input", e)
                    }
                },
                methods: {
                    selectSample(e) {
                        this.selectedSampleId = e.currentTarget.dataset.sampleId
                    },
                    create() {
                        this.show = !1,
                            this.doLoadSample(this.selectedSampleId)
                    },
                    close() {
                        this.show = !1
                    },
                    doLoadSample(e) {
                        this.$store.dispatch("doLoadSample", e)
                    }
                }
            }
            , De = (o(48),
                Object(r.a)(Ve, (function () {
                    var e = this
                        , t = e.$createElement
                        , o = e._self._c || t;
                    return o("b-modal", {
                        attrs: {
                            size: "lg",
                            "hide-header": !0,
                            "no-fade": !0,
                            centered: !0,
                            title: "Showcase"
                        },
                        model: {
                            value: e.show,
                            callback: function (t) {
                                e.show = t
                            },
                            expression: "show"
                        }
                    }, [o("div", {
                        staticClass: "modal-body"
                    }, [o("p", {
                        staticClass: "has-text-bold"
                    }, [e._v("サンプルメッセージから作成")]), e._v(" "), o("div", {
                        staticClass: "samples"
                    }, [o("b-container", [o("b-row", e._l(e.samples, (function (t) {
                        return o("b-col", {
                            key: t.id,
                            staticClass: "sample-item",
                            class: {
                                selected: e.selectedSampleId === t.id
                            },
                            attrs: {
                                cols: "6",
                                sm: "6",
                                md: "6",
                                lg: "4",
                                "data-sample-id": t.id
                            },
                            on: {
                                click: function (t) {
                                    return e.selectSample(t)
                                }
                            }
                        }, [o("div", {
                            staticClass: "thumb"
                        }, [o("b-img", {
                            attrs: {
                                src: t.pictureUrl,
                                fluid: ""
                            }
                        })], 1), e._v(" "), o("div", {
                            staticClass: "label"
                        }, [e._v("\n              " + e._s(t.title) + "\n            ")])])
                    }
                    )), 1)], 1)], 1)]), e._v(" "), o("div", {
                        attrs: {
                            slot: "modal-footer"
                        },
                        slot: "modal-footer"
                    }, [o("button", {
                        staticClass: "btn btn-secondary",
                        attrs: {
                            type: "button"
                        },
                        on: {
                            click: e.close
                        }
                    }, [e._v("\n      " + e._s(e.$t("cancel")) + "\n    ")]), e._v(" "), o("button", {
                        staticClass: "btn btn-primary",
                        attrs: {
                            type: "button"
                        },
                        on: {
                            click: function (t) {
                                return e.create()
                            }
                        }
                    }, [e._v("\n      " + e._s(e.$t("create")) + "\n    ")])])])
                }
                ), [], !1, null, "597ba6dc", null).exports)
            , Le = o(40)
            , qe = o.n(Le)
            , ze = o(3)
            , Qe = o(1)
            , He = o.n(Qe)
            , Je = o(10)
            , We = o.n(Je)
            , Ye = {
                name: "RegisterDestinationModal",
                props: {
                    value: Boolean
                },
                data: () => ({
                    show: !1,
                    step: 0,
                    verificationCode: "",
                    qrCode: "",
                    validUntil: null,
                    targetName: "",
                    targetPictureUrl: "",
                    error: ""
                }),
                filters: {
                    formatValidUntil: function (e) {
                        return We()("%Y-%m-%d %H:%M", new Date(e))
                    }
                },
                computed: {
                    registeredDestination() {
                        return this.$store.getters.getMessageDestinations.filter(e => e.validUntil)[0]
                    }
                },
                watch: {
                    value(e) {
                        this.show = e
                    },
                    show(e) {
                        console.log("register destination modal show"),
                            this.step = 0,
                            this.verificationCode = "",
                            this.error = "",
                            this.showQrCode(),
                            this.$emit("input", e)
                    }
                },
                methods: {
                    close() {
                        this.show = !1
                    },
                    async next() {
                        try {
                            const e = await He.a.post(ze.a.API_ROOT + "/v2/fx/send/destinations/verify", {
                                token: this.token,
                                code: this.verificationCode
                            });
                            console.log(e),
                                this.targetName = e.data.name,
                                this.targetPictureUrl = e.data.pictureUrl,
                                this.step = 1
                        } catch (e) {
                            this.error = "failed_to_verify_code",
                                this.verificationCode = ""
                        }
                    },
                    async register() {
                        console.log(this.verificationCode);
                        const e = await He.a.post(ze.a.API_ROOT + "/v2/fx/send/destinations", {
                            token: this.token,
                            code: this.verificationCode
                        });
                        if (console.log(e),
                            200 !== e.status)
                            return alert("failed to verify"),
                                void (this.verificationCode = "");
                        this.$store.dispatch("doGetMessageDestinations"),
                            this.close()
                    },
                    async showQrCode() {
                        const e = await He.a.post(ze.a.API_ROOT + "/v2/fx/send/issueInviteChallenge");
                        console.log(e),
                            this.token = e.data.token,
                            this.validUntil = e.data.validUntil;
                        const t = ze.a.LIFF_URL + "?token=" + this.token;
                        console.log(t),
                            this.qrCode = await qe.a.toDataURL(t)
                    }
                }
            }
            , Ke = (o(91),
            {
                name: "SendMessageModal",
                components: {
                    RegisterDestinationModal: Object(r.a)(Ye, (function () {
                        var e = this
                            , t = e.$createElement
                            , o = e._self._c || t;
                        return o("b-modal", {
                            attrs: {
                                size: "md",
                                "hide-header": !1,
                                "no-fade": !0,
                                centered: !0,
                                title: e.$t("register_destination")
                            },
                            on: {
                                hidden: function (t) {
                                    return e.$emit("close")
                                }
                            },
                            model: {
                                value: e.show,
                                callback: function (t) {
                                    e.show = t
                                },
                                expression: "show"
                            }
                        }, [0 == e.step ? o("div", [o("div", {
                            staticClass: "modal-body"
                        }, [o("p", [e._v(e._s(e.$t("register_destination.line1")))]), e._v(" "), o("div", {
                            staticStyle: {
                                "text-align": "center"
                            }
                        }, [o("img", {
                            attrs: {
                                src: e.qrCode,
                                width: "128",
                                height: "128"
                            }
                        }), e._v(" "), o("div", {
                            staticClass: "figure-caption text-black-50"
                        }, [e._v(e._s(e.$t("valid_until")) + ": " + e._s(e._f("formatValidUntil")(e.validUntil)))])]), e._v(" "), o("p", [e._v(e._s(e.$t("register_destination.line2")))]), e._v(" "), o("p", [e._v(e._s(e.$t("validation_code")))]), e._v(" "), o("input", {
                            directives: [{
                                name: "model",
                                rawName: "v-model",
                                value: e.verificationCode,
                                expression: "verificationCode"
                            }],
                            staticClass: "form-control",
                            attrs: {
                                type: "text"
                            },
                            domProps: {
                                value: e.verificationCode
                            },
                            on: {
                                input: function (t) {
                                    t.target.composing || (e.verificationCode = t.target.value)
                                }
                            }
                        }), e._v(" "), e.error ? o("div", {
                            staticClass: "alert alert-danger",
                            staticStyle: {
                                "margin-top": "1em"
                            },
                            attrs: {
                                role: "alert"
                            }
                        }, [e._v("\n        " + e._s(e.$t(e.error)) + "\n      ")]) : e._e()]), e._v(" "), o("div", {
                            staticClass: "buttons"
                        }, [o("button", {
                            staticClass: "btn btn-secondary",
                            attrs: {
                                type: "button"
                            },
                            on: {
                                click: e.close
                            }
                        }, [e._v("\n        " + e._s(e.$t("close")) + "\n      ")]), e._v(" "), o("button", {
                            staticClass: "btn btn-primary",
                            attrs: {
                                type: "button",
                                disabled: !e.verificationCode
                            },
                            on: {
                                click: e.next
                            }
                        }, [e._v("\n        " + e._s(e.$t("next")) + "\n      ")])])]) : e._e(), e._v(" "), 1 == e.step ? o("div", [o("div", {
                            staticClass: "modal-body"
                        }, [o("p", [e._v(e._s(e.$t("register_destination.line3")))]), e._v(" "), o("div", {
                            staticStyle: {
                                "text-align": "center",
                                padding: "1em"
                            }
                        }, [o("img", {
                            staticClass: "user-picture",
                            attrs: {
                                src: e.targetPictureUrl,
                                width: "64",
                                height: "64"
                            }
                        }), e._v(" "), o("span", {
                            staticClass: "user-name"
                        }, [e._v(e._s(e.targetName))])]), e._v(" "), e.registeredDestination ? o("div", {
                            staticClass: "alert alert-warning",
                            attrs: {
                                role: "alert"
                            }
                        }, [o("p", [e._v(e._s(e.$t("register_destination.line_unregister")))]), e._v(" "), o("img", {
                            staticClass: "user-picture",
                            attrs: {
                                src: e.registeredDestination.pictureUrl,
                                width: "64",
                                height: "64"
                            }
                        }), e._v(" "), o("span", {
                            staticClass: "user-name"
                        }, [e._v(e._s(e.registeredDestination.name))])]) : e._e()]), e._v(" "), o("div", {
                            staticClass: "buttons"
                        }, [o("button", {
                            staticClass: "btn btn-secondary",
                            attrs: {
                                type: "button"
                            },
                            on: {
                                click: e.close
                            }
                        }, [e._v("\n        " + e._s(e.$t("close")) + "\n      ")]), e._v(" "), o("button", {
                            staticClass: "btn btn-primary",
                            attrs: {
                                type: "button"
                            },
                            on: {
                                click: e.register
                            }
                        }, [e._v("\n        " + e._s(e.$t("register_destination")) + "\n      ")])])]) : e._e(), e._v(" "), o("div", {
                            attrs: {
                                slot: "modal-footer"
                            },
                            slot: "modal-footer"
                        })])
                    }
                    ), [], !1, null, "71fce120", null).exports
                },
                props: {
                    value: Boolean
                },
                data: () => ({
                    show: !1,
                    showRegisterDestinationModal: !1,
                    selected: "",
                    showOAQR: !1,
                    OA_QR: ze.a.OA_QR
                }),
                filters: {
                    formatValidUntil: function (e) {
                        return We()("%Y-%m-%d %H:%M", new Date(e))
                    }
                },
                computed: {
                    destinations() {
                        return console.log("computed", this.$store.getters.getMessageDestinations),
                            this.$store.getters.getMessageDestinations
                    }
                },
                watch: {
                    value(e) {
                        this.show = e
                    },
                    show(e) {
                        this.$emit("input", e),
                            e && this.$store.dispatch("doGetMessageDestinations")
                    },
                    flex() { }
                },
                mounted: function () {
                    console.log("mounted"),
                        this.$refs.registerDestinationModal.$on("close", () => {
                            this.show = !0
                        }
                        )
                },
                methods: {
                    close() {
                        this.show = !1
                    },
                    send() {
                        if (!this.selected)
                            return;
                        const e = this.$store.getters.getMessageDestinations.find(e => e.uid === this.selected)
                            , t = this.$store.getters.getAsFlex;
                        console.log("doSendMessage", e.uid, [t]),
                            this.$store.dispatch("doSendMessage", {
                                toUserId: e.uid,
                                messages: [{
                                    type: "flex",
                                    altText: "This is a flex message",
                                    contents: t
                                }]
                            }),
                            this.close()
                    },
                    registerDestination() {
                        this.showRegisterDestinationModal = !0,
                            console.log(this.$refs.registerDestinationModal)
                    },
                    async unregisterDestination() {
                        if (!confirm("Sure to unregister?"))
                            return;
                        await He.a.delete(ze.a.API_ROOT + "/v2/fx/send/destinations");
                        this.$store.dispatch("doGetMessageDestinations")
                    }
                }
            })
            , Xe = (o(92),
            {
                name: "MenuPane",
                components: {
                    EditorModal: Pe,
                    ShowcaseModal: De,
                    SendMessageModal: Object(r.a)(Ke, (function () {
                        var e = this
                            , t = e.$createElement
                            , o = e._self._c || t;
                        return o("div", [o("b-modal", {
                            attrs: {
                                size: "md",
                                "hide-header": !1,
                                "no-fade": !0,
                                centered: !0,
                                title: "Send Message"
                            },
                            model: {
                                value: e.show,
                                callback: function (t) {
                                    e.show = t
                                },
                                expression: "show"
                            }
                        }, [o("div", {
                            staticClass: "modal-body"
                        }, [o("p", [e._v(e._s(e.$t("destination_label")))]), e._v(" "), o("div", {
                            staticClass: "list-group"
                        }, [e._l(e.destinations, (function (t) {
                            return o("div", {
                                staticClass: "list-group-item",
                                staticStyle: {
                                    "margin-bottom": "0"
                                }
                            }, [o("div", {
                                staticClass: "custom-control custom-radio"
                            }, [o("input", {
                                directives: [{
                                    name: "model",
                                    rawName: "v-model",
                                    value: e.selected,
                                    expression: "selected"
                                }],
                                staticClass: "custom-control-input",
                                attrs: {
                                    type: "radio",
                                    id: t.uid
                                },
                                domProps: {
                                    value: t.uid,
                                    checked: e._q(e.selected, t.uid)
                                },
                                on: {
                                    change: function (o) {
                                        e.selected = t.uid
                                    }
                                }
                            }), e._v(" "), o("label", {
                                staticClass: "custom-control-label",
                                attrs: {
                                    for: t.uid
                                }
                            }, [o("img", {
                                staticClass: "user-picture",
                                attrs: {
                                    src: t.pictureUrl,
                                    width: "64",
                                    height: "64"
                                }
                            }), e._v(" "), o("span", {
                                staticClass: "user-name"
                            }, [e._v(e._s(t.name))])]), e._v(" "), t.validUntil ? o("div", {
                                staticStyle: {
                                    padding: "10px 0 0 0"
                                }
                            }, [o("button", {
                                staticClass: "btn btn-outline-secondary",
                                attrs: {
                                    type: "button"
                                },
                                on: {
                                    click: e.unregisterDestination
                                }
                            }, [e._v("\n              " + e._s(e.$t("unregister")) + "\n            ")]), e._v(" "), o("div", {
                                staticClass: "figure-caption text-black-50"
                            }, [e._v(e._s(e.$t("valid_until")) + ": " + e._s(e._f("formatValidUntil")(t.validUntil)))])]) : e._e()])])
                        }
                        )), e._v(" "), o("div", {
                            staticClass: "list-group-item"
                        }, [o("button", {
                            staticClass: "btn btn-outline-primary",
                            attrs: {
                                type: "button"
                            },
                            on: {
                                click: e.registerDestination
                            }
                        }, [e._v("\n          " + e._s(e.$t("register_destination")) + "\n        ")])])], 2), e._v(" "), o("div", {
                            staticStyle: {
                                "padding-top": "1em"
                            }
                        }, [o("p", [e._v("\n        " + e._s(e.$t("to_receive_message_add_frined.prefix")) + "\n        "), o("a", {
                            attrs: {
                                href: "javascript:void()"
                            },
                            on: {
                                click: function (t) {
                                    t.preventDefault(),
                                        e.showOAQR = !e.showOAQR
                                }
                            }
                        }, [e._v(e._s(e.$t("to_receive_message_add_frined.link")))]), e._v("\n        " + e._s(e.$t("to_receive_message_add_frined.suffix")) + "\n      ")]), e._v(" "), e.showOAQR ? o("div", {
                            staticStyle: {
                                "text-align": "center"
                            }
                        }, [o("img", {
                            attrs: {
                                src: e.OA_QR,
                                width: "240",
                                height: "240"
                            }
                        })]) : e._e()])]), e._v(" "), o("div", {
                            attrs: {
                                slot: "modal-footer"
                            },
                            slot: "modal-footer"
                        }, [o("button", {
                            staticClass: "btn btn-secondary",
                            attrs: {
                                type: "button"
                            },
                            on: {
                                click: e.close
                            }
                        }, [e._v("\n      " + e._s(e.$t("cancel")) + "\n    ")]), e._v(" "), o("button", {
                            staticClass: "btn btn-primary",
                            attrs: {
                                type: "button",
                                disabled: !e.selected
                            },
                            on: {
                                click: e.send
                            }
                        }, [e._v("\n      " + e._s(e.$t("send")) + "\n    ")])])]), e._v(" "), o("RegisterDestinationModal", {
                            ref: "registerDestinationModal",
                            model: {
                                value: e.showRegisterDestinationModal,
                                callback: function (t) {
                                    e.showRegisterDestinationModal = t
                                },
                                expression: "showRegisterDestinationModal"
                            }
                        })], 1)
                    }
                    ), [], !1, null, "364d2986", null).exports
                },
                data: () => ({
                    showEditorModal: !1,
                    showShowcaseModal: !1,
                    showSendMessageModal: !1
                }),
                computed: {
                    samples() {
                        return this.$store.state.samples
                    }
                },
                methods: {
                    reset(e) {
                        this.$store.dispatch("doReset", e)
                    },
                    doLoadSample(e) {
                        this.$store.dispatch("doLoadSample", e)
                    },
                    openEditor() {
                        this.showEditorModal = !0
                    },
                    openShowcase() {
                        this.showShowcaseModal = !0
                    },
                    openSendMessage() {
                        this.showSendMessageModal = !0
                    }
                }
            })
            , Ze = Object(r.a)(Xe, (function () {
                var e = this
                    , t = e.$createElement
                    , o = e._self._c || t;
                return o("div", [o("b-dropdown", {
                    attrs: {
                        text: "New",
                        variant: "primary"
                    }
                }, [o("b-dropdown-item", {
                    key: "bubble",
                    on: {
                        click: function (t) {
                            return e.reset("bubble")
                        }
                    }
                }, [e._v("\n      bubble\n    ")]), e._v(" "), o("b-dropdown-item", {
                    key: "carousel",
                    on: {
                        click: function (t) {
                            return e.reset("carousel")
                        }
                    }
                }, [e._v("\n      carousel\n    ")])], 1), e._v(" "), o("div", {
                    staticClass: "btn-group"
                }, [o("button", {
                    staticClass: "btn btn-secondary",
                    attrs: {
                        type: "button"
                    },
                    on: {
                        click: e.openShowcase
                    }
                }, [e._v("\n      Showcase\n    ")])]), e._v(" "), o("div", {
                    staticClass: "btn-group"
                }, [o("button", {
                    staticClass: "btn btn-secondary",
                    attrs: {
                        type: "button"
                    },
                    on: {
                        click: e.openSendMessage
                    }
                }, [o("i", {
                    staticClass: "fab fa-line"
                }), e._v(" Send...\n    ")])]), e._v(" "), o("div", {
                    staticClass: "btn-group"
                }, [o("button", {
                    staticClass: "btn btn-secondary",
                    attrs: {
                        type: "button"
                    },
                    on: {
                        click: e.openEditor
                    }
                }, [o("i", {
                    staticClass: "fa fa-code"
                }), e._v(" View as JSON\n    ")])]), e._v(" "), o("ShowcaseModal", {
                    model: {
                        value: e.showShowcaseModal,
                        callback: function (t) {
                            e.showShowcaseModal = t
                        },
                        expression: "showShowcaseModal"
                    }
                }), e._v(" "), o("EditorModal", {
                    model: {
                        value: e.showEditorModal,
                        callback: function (t) {
                            e.showEditorModal = t
                        },
                        expression: "showEditorModal"
                    }
                }), e._v(" "), o("SendMessageModal", {
                    model: {
                        value: e.showSendMessageModal,
                        callback: function (t) {
                            e.showSendMessageModal = t
                        },
                        expression: "showSendMessageModal"
                    }
                })], 1)
            }
            ), [], !1, null, null, null).exports
            , et = o(20);
        class tt {
            constructor({ withId: e } = {}) {
                this.withId = e || !1
            }
            handleCarousel(e) {
                if (!e)
                    throw new Error("unexpected data: " + e);
                return {
                    type: "carousel",
                    contents: e.children.map(e => this.handleBubble(e))
                }
            }
            handleBubble(e) {
                if (!e)
                    throw new Error("unexpected data: " + e);
                const t = {
                    type: "bubble"
                }
                    , o = {};
                return Object.keys(e).forEach(n => {
                    "id" === n || "root" === n || ("children" === n ? e.children.forEach(e => {
                        const n = e.type
                            , s = e.children;
                        Array.isArray(s) && 1 === s.length && (t[n] = this.handleComponent(s[0])),
                            Object.keys(e.style).length > 0 && (o[n] = e.style)
                    }
                    ) : t[n] = e[n])
                }
                ),
                    Object.keys(o).length > 0 && (t.styles = o),
                    t
            }
            handleComponent(e) {
                if (!e)
                    throw new Error("unexpected data: " + e);
                const t = e.type;
                if (!t)
                    throw new Error("unexpected component type: " + t);
                const o = {};
                return Object.keys(e).forEach(n => {
                    ("id" !== n || this.withId) && ("children" === n && "video" === t ? 1 === e.children.length ? o.altContent = this.handleComponent(e.children[0]) : o.altContent = null : "children" === n ? o.contents = e.children.map(e => this.handleComponent(e)) : o[n] = e[n])
                }
                ),
                    o
            }
            convert(e) {
                if (!e)
                    throw new Error("unexpected data: " + e);
                switch (e.type) {
                    case "carousel":
                        return this.handleCarousel(e);
                    case "bubble":
                        return this.handleBubble(e);
                    default:
                        return this.handleComponent(e)
                }
            }
        }
        var ot = o(41)
            , nt = o.n(ot);
        class st {
            constructor({ idgen: e } = {}) {
                this.idgen = e || nt.a
            }
            handleBlock(e, t) {
                let o = {};
                return t.styles && t.styles[e] && (o = t.styles[e]),
                {
                    type: e,
                    id: this.idgen(),
                    style: o,
                    children: t[e] ? [this.handleComponent(t[e])] : []
                }
            }
            handleCarousel(e) {
                if (!e)
                    throw new Error("unexpected data: " + e);
                return {
                    type: "carousel",
                    id: this.idgen(),
                    root: !0,
                    children: e.contents.map(e => this.handleBubble(e))
                }
            }
            handleBubble(e) {
                if (!e)
                    throw new Error("unexpected data: " + e);
                return {
                    type: "bubble",
                    size: e.size,
                    direction: e.direction,
                    id: this.idgen(),
                    root: !1,
                    children: ["header", "hero", "body", "footer"].map(t => this.handleBlock(t, e))
                }
            }
            handleComponent(e) {
                if (!e)
                    throw new Error("unexpected data: " + e);
                const t = e.type;
                if (!t)
                    throw new Error("unexpected component type: " + t);
                const o = {
                    id: this.idgen()
                };
                return Object.keys(e).forEach(t => {
                    "contents" === t ? o.children = e.contents.map(e => this.handleComponent(e)) : "altContent" === t ? o.children = [this.handleComponent(e.altContent)] : o[t] = e[t]
                }
                ),
                    o
            }
            convert(e, t = !1) {
                if (!e)
                    throw new Error("unexpected data: " + e);
                switch (e.type) {
                    case "carousel":
                        return this.handleCarousel(e);
                    case "bubble":
                        const o = this.handleBubble(e);
                        return o.root = t,
                            o;
                    default:
                        return this.handleComponent(e)
                }
            }
        }
        function it(e, t) {
            const o = e.shift();
            switch (o) {
                case "contents":
                    {
                        const n = parseInt(e.shift());
                        return n >= 0 ? it(e, t.children[n]) : {
                            node: t,
                            property: o
                        }
                    }
                case "style":
                case "background":
                case "action":
                    return {
                        node: t,
                        property: e.shift(),
                        parent: o
                    };
                default:
                    return {
                        node: t,
                        property: o
                    }
            }
        }
        function rt(e, t) {
            switch (Array.isArray(e) || (e = e.split("/").filter(e => e.length > 0)),
            t.type) {
                case "carousel":
                    return function (e, t) {
                        const o = e.shift();
                        if ("contents" === o) {
                            const o = parseInt(e.shift());
                            if (o >= 0)
                                return rt(e, t.children[o])
                        }
                        return {
                            node: t,
                            property: o
                        }
                    }(e, t);
                case "bubble":
                    return function (e, t) {
                        const o = e.shift();
                        switch (o) {
                            case "styles":
                                {
                                    const o = e.shift();
                                    e.unshift("style");
                                    return it(e, t.children.find(e => e.type === o))
                                }
                            case "header":
                            case "hero":
                            case "body":
                            case "footer":
                                return it(e, t.children.find(e => e.type === o).children[0]);
                            default:
                                return {
                                    node: t,
                                    property: o
                                }
                        }
                    }(e, t);
                default:
                    return it(e, t)
            }
        }
        var at = {
            findByPath: rt
        };
        class lt {
            constructor(e, t = {}) {
                this.root = function e(t) {
                    if (!t)
                        return null;
                    const o = Object.assign({}, t);
                    return function (e) {
                        let t = e.type;
                        return "header" === t || "hero" === t || "body" === t || "footer" === t
                    }(t) && (o.style = e(t.style)),
                        t.children && (o.children = t.children.map(t => e(t))),
                        t.action && (o.action = e(t.action)),
                        o
                }(e),
                    this.flexToTree = new st(t)
            }
            getRoot() {
                return this.root
            }
            findById(e) {
                return function e(t, o) {
                    if (!t)
                        return null;
                    if (t.id === o)
                        return t;
                    if (t.children)
                        for (const n of t.children) {
                            const t = e(n, o);
                            if (null != t)
                                return t
                        }
                    return null
                }(this.root, e)
            }
            findByPath(e) {
                return at.findByPath(e, this.root)
            }
            addNode(e, t) {
                const o = this.findById(e);
                if (null == o)
                    console.error("node not found");
                else {
                    const e = this.flexToTree.convert(t);
                    Array.isArray(o.children) ? o.children.push(e) : o.children = [e]
                }
            }
            removeNode(e) {
                !function e(t, o) {
                    return t ? t.id === o ? null : (t.children && (t.children = t.children.map(t => e(t, o)).filter(e => null != e)),
                        t) : null
                }(this.root, e)
            }
            moveNode(e, t) {
                !function e(t, o, n) {
                    if (!t)
                        return null;
                    if (t.id === o)
                        return t;
                    if (t.children) {
                        const s = t.children;
                        let i = -1;
                        if (s.forEach((t, s) => {
                            null != e(t, o, n) && (i = s)
                        }
                        ),
                            i >= 0) {
                            const e = i + (n > 0 ? 1 : -1);
                            e >= 0 && e < s.length && ([s[i], s[e]] = [s[e], s[i]])
                        }
                    }
                    return null
                }(this.root, e, t)
            }
        }
        n.a.use(et.a),
            He.a.defaults.timeout = 6e4,
            He.a.defaults.withCredentials = !0,
            He.a.defaults.xsrfHeaderName = "X-CSRF-Token",
            He.a.defaults.headers["X-Requested-With"] = "XMLHttpRequest",
            He.a.defaults.validateStatus = e => e >= 200 && e < 300 || 401 == e,
            He.a.interceptors.response.use((function (e) {
                return 401 == e.status && (location.href = `${ze.a.LOGIN_ENDPOINT}?redirectUri=${encodeURIComponent(location.href)}`),
                    e
            }
            ), (function (e) {
                return Promise.reject(e)
            }
            ));
        var dt = new et.a.Store({
            state: {
                selectedNodeId: "",
                multiSelectedNodeIds: [],
                hoveredNodeId: "",
                tree: {},
                clipboard: [],
                samples: [],
                messages: [],
                undo: [],
                redo: [],
                html: "",
                containerType: "bubble",
                shareUrl: "",
                destinations: []
            },
            mutations: {
                setRenderResult(e, { html: t, containerType: o }) {
                    e.html = t,
                        e.containerType = o
                },
                clearRenderResult(e) {
                    e.html = "",
                        e.containerType = "bubble"
                },
                setMessages(e, t) {
                    e.messages = t
                },
                initDestinations(e, t) {
                    e.destinations = t
                },
                initTree(e, t) {
                    Object.keys(e.tree).length > 0 && (e.undo.push(e.tree),
                        e.redo = []),
                        e.selectedNodeId = "",
                        e.multiSelectedNodeIds = [],
                        e.tree = (new st).convert(t, !0)
                },
                updateProperty(e, { id: t, property: o, value: n, parent: s }) {
                    const i = new lt(e.tree)
                        , r = i.findById(t);
                    r ? (s ? (console.log(`property set: ${s}#${o} = ${n}`),
                        r[s][o] = n) : (console.log(`property set: ${o} = ${n}`),
                            r[o] = n),
                        e.undo.push(e.tree),
                        e.redo = [],
                        e.tree = i.getRoot()) : console.error("target node not found: " + t)
                },
                deleteProperty(e, { id: t, property: o, parent: n }) {
                    const s = new lt(e.tree)
                        , i = s.findById(t);
                    i ? (n ? (console.log(`property deleted: ${n}#${o}`),
                        delete i[n][o]) : (console.log("property deleted: " + o),
                            delete i[o]),
                        e.undo.push(e.tree),
                        e.redo = [],
                        e.tree = s.getRoot()) : console.error("target node not found: " + t)
                },
                setSamples(e, t) {
                    e.samples = t
                },
                setSelectedNodeId(e, t) {
                    e.selectedNodeId = t,
                        e.multiSelectedNodeIds = [t]
                },
                addSelectedNodeId(e, t) {
                    e.selectedNodeId = "",
                        e.multiSelectedNodeIds.push(t)
                },
                removeSelectedNodeId(e, t) {
                    e.selectedNodeId === t && (e.selectedNodeId = ""),
                        e.multiSelectedNodeIds = e.multiSelectedNodeIds.filter(e => e !== t)
                },
                setHoveredNodeId(e, t) {
                    e.hoveredNodeId = t
                },
                addNode(e, { parentId: t, type: o }) {
                    const n = R.of(o);
                    if (n) {
                        const o = new lt(e.tree);
                        o.addNode(t, n),
                            e.undo.push(e.tree),
                            e.redo = [],
                            e.tree = o.getRoot()
                    } else
                        console.error("unexpected node type: " + o)
                },
                removeNode(e, { ids: t }) {
                    const o = new lt(e.tree);
                    t.forEach(e => o.removeNode(e)),
                        e.selectedNodeId = "",
                        e.multiSelectedNodeIds = [],
                        e.undo.push(e.tree),
                        e.redo = [],
                        e.tree = o.getRoot()
                },
                copyNode(e, { ids: t }) {
                    const o = new lt(e.tree);
                    e.clipboard = t.map(e => o.findById(e)),
                        e.messages = [{
                            text: "copied!",
                            level: "success"
                        }]
                },
                cutNode(e, { ids: t }) {
                    const o = new lt(e.tree);
                    e.clipboard = t.map(e => o.findById(e)),
                        t.forEach(e => o.removeNode(e)),
                        e.selectedNodeId = "",
                        e.multiSelectedNodeIds = [],
                        e.undo.push(e.tree),
                        e.redo = [],
                        e.tree = o.getRoot()
                },
                pasteNode(e, { parentId: t }) {
                    if (e.clipboard.length > 0) {
                        const o = new lt(e.tree);
                        e.clipboard.forEach(e => {
                            o.addNode(t, (new tt).convert(e))
                        }
                        ),
                            e.undo.push(e.tree),
                            e.redo = [],
                            e.tree = o.getRoot()
                    }
                },
                move(e, { id: t, direction: o }) {
                    const n = new lt(e.tree);
                    n.moveNode(t, o),
                        e.undo.push(e.tree),
                        e.redo = [],
                        e.tree = n.getRoot()
                },
                undo(e) {
                    e.undo.length > 0 && (e.redo.push(e.tree),
                        e.tree = e.undo.pop())
                },
                redo(e) {
                    e.redo.length > 0 && (e.undo.push(e.tree),
                        e.tree = e.redo.pop())
                },
                setShareUrl(e, t) {
                    e.shareUrl = t
                }
            },
            actions: {
                async doGetSession(e) {
                    try {
                        const e = await He.a.get(ze.a.API_ROOT + "/v1/session");
                        if (401 === e.status)
                            return;
                        if (!e.data.account) {
                            const e = new URLSearchParams;
                            e.append("redirect", location.pathname + location.search),
                                location.href = `${location.protocol}//${location.host}/console/register?${e.toString()}`
                        }
                    } catch (t) {
                        console.error(error),
                            e.commit("setMessages", [{
                                text: "failed to retrieve session"
                            }])
                    }
                },
                doGetSamples: e => He.a.get(ze.a.API_ROOT + "/v1/fx/samples").then(t => {
                    e.commit("setSamples", t.data.samples)
                }
                ).catch(t => {
                    console.error(t),
                        e.commit("setMessages", [{
                            text: "failed to retrieve samples"
                        }])
                }
                ),
                doRender(e) {
                    e.commit("setMessages", []);
                    const t = e.getters.getAsFlexWithId;
                    return He.a.post(ze.a.API_ROOT + "/v1/fx/render", t).then(o => {
                        e.commit("setRenderResult", {
                            html: o.data,
                            containerType: t.type
                        }),
                            e.commit("setMessages", [{
                                text: "OK",
                                level: "success"
                            }])
                    }
                    ).catch(t => {
                        if (console.error(t),
                            e.commit("clearRenderResult"),
                            t.response.data && t.response.data.details) {
                            const o = t.response.data.details.map(e => ({
                                path: e.property,
                                text: e.message
                            }));
                            e.commit("setMessages", o)
                        } else
                            e.commit("setMessages", [{
                                text: "failed to render message"
                            }])
                    }
                    )
                },
                doLoadSample: (e, t) => He.a.get(`${ze.a.API_ROOT}/v1/fx/samples/${t}`).then(t => {
                    e.commit("initTree", t.data)
                }
                ).catch(t => {
                    console.error(t),
                        e.commit("setMessages", [{
                            text: "failed to load preset"
                        }])
                }
                ),
                doReset(e, t) {
                    e.commit("initTree", R.of(t))
                },
                doGetMessageDestinations: e => He.a.get(ze.a.API_ROOT + "/v2/fx/send/destinations").then(t => {
                    e.commit("initDestinations", t.data)
                }
                ).catch(t => {
                    console.error(t),
                        e.commit("setMessages", [{
                            text: "failed to get message destinations"
                        }])
                }
                ),
                doSendMessage: (e, t) => He.a.post(ze.a.API_ROOT + "/v2/fx/send/message", {
                    toUserId: t.toUserId,
                    messages: t.messages
                }).then(t => {
                    e.commit("setMessages", [{
                        text: "Message Sent",
                        level: "success"
                    }])
                }
                ).catch(t => {
                    console.error(t),
                        e.commit("setMessages", [{
                            text: "failed to load preset"
                        }])
                }
                )
            },
            getters: {
                getMessages: e => e.messages,
                getTree: e => e.tree.type ? e.tree : null,
                getMessageDestinations: e => e.destinations,
                getAsFlex: e => e.tree.type ? (new tt).convert(e.tree) : null,
                getAsFlexWithId: e => e.tree.type ? new tt({
                    withId: !0
                }).convert(e.tree) : null,
                getById: e => t => {
                    if (e.tree.type) {
                        return new lt(e.tree).findById(t)
                    }
                    return null
                }
                ,
                getSelectedNodeId: e => e.selectedNodeId,
                getMultiSelectedNodeIds: e => e.multiSelectedNodeIds,
                getHoveredNodeId: e => e.hoveredNodeId,
                getSelectedNode: (e, t) => t.getById(e.selectedNodeId),
                getErrors(e) {
                    if (0 === e.messages.length)
                        return [];
                    const t = new lt(e.tree);
                    return e.messages.filter(e => !!e.path).map(e => {
                        const o = t.findByPath(e.path);
                        return o ? Object.assign({}, e, o) : null
                    }
                    ).filter(e => null != e)
                },
                getClipboard: e => e.clipboard,
                canUndo: e => e.undo.length > 0,
                canRedo: e => e.redo.length > 0,
                getHtml: e => e.html,
                getContainerType: e => e.containerType,
                getShareUrl: e => e.shareUrl
            }
        })
            , ct = o(11);
        o(35),
            o(36),
            o(37),
            o(18);
        n.a.use(s.b),
            n.a.use(s.e),
            n.a.use(s.c),
            n.a.use(s.d),
            n.a.use(s.a),
            n.a.use(s.f),
            n.a.use(ct.a);
        var ut = {
            name: "App",
            i18n: new ct.a({
                locale: "en",
                messages: o(19)
            }),
            components: {
                HeaderPane: Ue,
                InboxPane: a,
                ViewerPane: h,
                TreePane: p,
                FormPane: je,
                CommandPane: Ee,
                MenuPane: Ze
            },
            store: dt,
            mounted() {
                this.$store.watch(e => e.tree, () => {
                    this.$store.dispatch("doRender")
                }
                )
            },
            async created() {
                "cancelled" !== new URLSearchParams(location.search).get("status") ? (await this.$store.dispatch("doGetSession"),
                    await this.$store.dispatch("doGetSamples"),
                    await this.$store.dispatch("doLoadSample", this.$store.state.samples[0].id)) : location.href = `${location.protocol}//${location.host}/`
            }
        }
            , pt = (o(97),
                Object(r.a)(ut, (function () {
                    var e = this
                        , t = e.$createElement
                        , o = e._self._c || t;
                    return o("div", {
                        attrs: {
                            id: "app"
                        }
                    }, [o("div", {
                        attrs: {
                            id: "header"
                        }
                    }, [o("HeaderPane")], 1), e._v(" "), o("div", {
                        attrs: {
                            id: "top-pane"
                        }
                    }, [o("h1", [e._v("FLEX MESSAGE SIMULATOR")]), e._v(" "), o("MenuPane")], 1), e._v(" "), o("div", {
                        attrs: {
                            id: "main-pane"
                        }
                    }, [o("div", {
                        attrs: {
                            id: "left-pane"
                        }
                    }, [o("ViewerPane"), e._v(" "), o("InboxPane")], 1), e._v(" "), o("div", {
                        attrs: {
                            id: "center-pane"
                        }
                    }, [o("CommandPane"), e._v(" "), o("TreePane")], 1), e._v(" "), o("FormPane")], 1)])
                }
                ), [], !1, null, "67567c9f", null).exports);
        new n.a({
            el: "#app",
            render: e => e(pt)
        })
    }
});
