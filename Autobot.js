var Autobot = {
    title: 'Autobot',
    version: 'v0.55',
    domain: 'https://cdn.jsdelivr.net/gh/gredfc/lagostas@main/',
    botWnd: '',
    isLogged: false,
    Account: {
        player_id: Game.player_id,
        player_name: Game.player_name,
        world_id: Game.world_id,
        locale_lang: Game.locale_lang,
        premium_grepolis: Game.premium_user,
        csrfToken: Game.csrfToken
    },
    init: function () {
        ConsoleLog.Log('Initialize Autobot', 0);
        Autobot.loadModules();
        Autobot.initAjax();
        Autobot.initMapTownFeature();
        Autobot.fixMessage();
        Assistant.init();
    },
    loadModules: function () {
        ModuleManager.loadModules();
    },
    initWnd: function () {
        if (!Autobot.isLogged) {
            return;
        }
        if (typeof Autobot.botWnd !== 'undefined') {
            try {
                Autobot.botWnd.close();
            } catch (F) {}
            Autobot.botWnd = undefined;
        }

        Autobot.botWnd = Layout.dialogWindow.open('', Autobot.title + ' v' + Autobot.version, 500, 350, '', false);
        Autobot.botWnd.setHeight([350]);
        Autobot.botWnd.setPosition(['center', 'center']);
        var el = Autobot.botWnd.getJQElement();
        el.append($('<div/>', {
            "class": 'menu_wrapper',
            "style": 'left: 78px; right: 14px'
        }).append($('<ul/>', {
            "class": 'menu_inner'
        }).prepend(Autobot.addMenuItem('AUTHORIZE', 'Account', 'Account'))
          .prepend(Autobot.addMenuItem('CONSOLE', 'Assistant', 'Assistant'))
          .prepend(Autobot.addMenuItem('ASSISTANT', 'Console', 'Console'))));
        
        if (typeof Autoattack !== 'undefined') {
            el.find('.menu_inner li:last-child').before(Autobot.addMenuItem('ATTACKMODULE', 'Attack', 'Autoattack'));
        }
        if (typeof Autobuild !== 'undefined') {
            el.find('.menu_inner li:last-child').before(Autobot.addMenuItem('CONSTRUCTMODULE', 'Build', 'Autobuild'));
        }
        if (typeof Autoculture !== 'undefined') {
            el.find('.menu_inner li:last-child').before(Autobot.addMenuItem('CULTUREMODULE', 'Culture', 'Autoculture'));
        }
        if (typeof Autofarm !== 'undefined') {
            el.find('.menu_inner li:last-child').before(Autobot.addMenuItem('FARMMODULE', 'Farm', 'Autofarm'));
        }
        $('#Autobot-AUTHORIZE').click();
    },
    addMenuItem: function (id, label, module) {
        return $('<li/>').append($('<a/>', {
            "class": 'submenu_link',
            "href": '#',
            "id": 'Autobot-' + id,
            "rel": module
        }).click(function () {
            Autobot.botWnd.getJQElement().find('li a.submenu_link').removeClass('active');
            $(this).addClass('active');
            Autobot.botWnd.setContent2(Autobot.getContent($(this).attr('rel')));
            if ($(this).attr('rel') === 'Console') {
                var terminal = $('.terminal');
                var height = $('.terminal-output')[0].scrollHeight;
                terminal.scrollTop(height);
            }
        }).append(function () {
            return module !== 'Support' ? $('<span/>', {
                "class": 'left'
            }).append($('<span/>', {
                "class": 'right'
            }).append($('<span/>', {
                "class": 'middle'
            }).html(label))) : '<a id="help-button" onclick="return false;" class="confirm"></a>';
        }));
    },
    getContent: function (module) {
        if (module === 'Console') {
            return ConsoleLog.contentConsole();
        } else if (module === 'Account') {
            return Autobot.contentAccount();
        } else if (typeof window[module] !== 'undefined') {
            return window[module].contentSettings();
        }
        return '';
    },
    contentAccount: function () {
        var rows = {
            "Name:": Game.player_name,
            "World:": Game.world_id,
            "Rank:": Game.player_rank,
            "Towns:": Game.player_villages,
            "Language:": Game.locale_lang
        };
        var table = $('<table/>', {
            "class": 'game_table layout_main_sprite',
            "cellspacing": '0',
            "width": '100%'
        }).append(function () {
            var counter = 0;
            var tbody = $('<tbody/>');
            $.each(rows, function (index, value) {
                tbody.append($('<tr/>', {
                    "class": counter % 2 ? 'game_table_even' : 'game_table_odd'
                }).append($('<td/>', {
                    "style": 'background-color: #DFCCA6;width: 30%;'
                }).html(index)).append($('<td/>').html(value)));
                counter++;
            });
            return tbody;
        });
        return FormBuilder.gameWrapper('Account', 'account_property_wrapper', table, 'margin-bottom:9px;')[0].outerHTML;
    },
    fixMessage: function () {
        var fix = function (original) {
            return function () {
                original.apply(this, arguments);
                $(window).unbind('click');
            };
        };
        HumanMessage._initialize = fix(HumanMessage._initialize);
    },
    initAjax: function () {
        $(document).ajaxComplete(function (event, xhr, settings) {
            if (settings.url.indexOf(Autobot.domain) === -1 && settings.url.indexOf('/game/') !== -1 && xhr.readyState === 4 && xhr.status === 200) {
                var url = settings.url.split('?');
                var action = url[0].substr(6) + '/' + url[1].split('&')[1].substr(7);
                if (typeof Autobuild !== 'undefined') {
                    Autobuild.calls(action);
                }
                if (typeof Autoattack !== 'undefined') {
                    Autoattack.calls(action, xhr.responseText);
                }
            }
        });
    },
    randomize: function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    secondsToTime: function (seconds) {
        var days = Math.floor(seconds / 86400);
        var hours = Math.floor((seconds % 86400) / 3600);
        var minutes = Math.floor(((seconds % 86400) % 3600) / 60);
        return (days ? days + ' days ' : '') + (hours ? hours + ' hours ' : '') + (minutes ? minutes + ' minutes ' : '');
    },
    timeToSeconds: function (time) {
        var parts = time.split(':');
        var total = 0;
        var multiplier = 1;
        while (parts.length > 0) {
            total += multiplier * parseInt(parts.pop(), 10);
            multiplier *= 60;
        }
        return total;
    },
    createNotification: function (title, message) {
        var handler = (typeof Layout.notify === 'undefined') ? new NotificationHandler() : Layout;
        handler.notify($('#notification_area>.notification').length + 1, title, '<span><b>Autobot</b></span>' + message + '<span class="small notification_date">Version ' + Autobot.version + '</span>');
    },
    toHHMMSS: function (seconds) {
        var hours = ~~(seconds / 3600);
        var minutes = ~~((seconds % 3600) / 60);
        var secs = seconds % 60;
        var ret = '';
        if (hours > 0) {
            ret += hours + ':' + (minutes < 10 ? '0' : '');
        }
        ret += minutes + ':' + (secs < 10 ? '0' : '');
        ret += secs;
        return ret;
    },
    stringify: function (obj) {
        var type = typeof obj;
        if (type === 'string') {
            return '"' + obj + '"';
        }
        if (type === 'boolean' || type === 'number') {
            return obj;
        }
        if (type === 'function') {
            return obj.toString();
        }
        var items = [];
        for (var key in obj) {
            items.push('"' + key + '":' + this.stringify(obj[key]));
        }
        return '{' + items.join(',') + '}';
    },
    town_map_info: function (towns, data) {
        if (towns !== undefined && towns.length > 0 && data.player_name) {
            for (var i = 0; i < towns.length; i++) {
                if (towns[i].className === 'flag town') {
                    if (typeof Assistant !== 'undefined') {
                        if (Assistant.settings.town_names) {
                            $(towns[i]).addClass('active_town');
                        }
                        if (Assistant.settings.player_name) {
                            $(towns[i]).addClass('active_player');
                        }
                        if (Assistant.settings.alliance_name) {
                            $(towns[i]).addClass('active_alliance');
                        }
                    }
                    $(towns[i]).append('<div class="player_name">' + (data.player_name || '') + '</div>');
                    $(towns[i]).append('<div class="town_name">' + data.name + '</div>');
                    $(towns[i]).append('<div class="alliance_name">' + (data.alliance_name || '') + '</div>');
                    break;
                }
            }
        }
        return towns;
    },
    checkPremium: function (type) {
        return $('.advisor_frame.' + type + ' div').hasClass(type + '_active');
    },
    initWindow: function () {
        $('.nui_main_menu').css('top', '282px');
        
        var toolbox = $('<div/>', {
            class: 'nui_bot_toolbox'
        });
        
        var toggleBtn = $('<div/>', {
            class: 'toggle-panel-btn',
            title: 'Minimizar painel'
        }).append($('<span/>', {
            class: 'tooltip-text',
            text: 'Minimizar/Expandir'
        }));
        
        toggleBtn.on('click', function() {
            var panel = $(this).closest('.nui_bot_toolbox');
            panel.toggleClass('minimized');
            if (panel.hasClass('minimized')) {
                $(this).find('.tooltip-text').text('Expandir painel');
            } else {
                $(this).find('.tooltip-text').text('Minimizar painel');
            }
            localStorage.setItem('autobot_panel_minimized', panel.hasClass('minimized'));
        });
        
        var wasMinimized = localStorage.getItem('autobot_panel_minimized') === 'true';
        if (wasMinimized) {
            toolbox.addClass('minimized');
            toggleBtn.find('.tooltip-text').text('Expandir painel');
        }
        
        toolbox.append(toggleBtn);
        toolbox.append($('<div/>', {
            class: 'bot_menu layout_main_sprite'
        }).append($('<ul/>').append($('<li/>', {
            id: 'Autofarm_onoff',
            class: 'disabled'
        }).append($('<span/>', {
            class: 'autofarm farm_town_status_0'
        }))).append($('<li/>', {
            id: 'Autoculture_onoff',
            class: 'disabled'
        }).append($('<span/>', {
            class: 'autoculture farm_town_status_0'
        }))).append($('<li/>', {
            id: 'Autobuild_onoff',
            class: 'disabled'
        }).append($('<span/>', {
            class: 'autobuild toolbar_activities_recruits'
        }))).append($('<li/>', {
            id: 'Autoattack_onoff',
            class: 'disabled'
        }).append($('<span/>', {
            class: 'autoattack sword_icon'
        }))).append($('<li/>').append($('<span/>', {
            href: '#',
            class: 'botsettings circle_button_settings'
        }).on('click', function () {
            if (Autobot.isLogged) {
                Autobot.initWnd();
            }
        }).mousePopup(new MousePopup(DM.getl10n('COMMON').main_menu.settings))))));
        
        toolbox.append($('<div/>', {
            id: 'time_autobot',
            class: 'time_row'
        }));
        toolbox.append($('<div/>', {
            class: 'bottom'
        }));
        
        toolbox.insertAfter('.nui_left_box');
    },
    initMapTownFeature: function () {
        var wrapper = function (original) {
            return function () {
                var towns = original.apply(this, arguments);
                return Autobot.town_map_info(towns, arguments[0]);
            };
        };
        MapTiles.createTownDiv = wrapper(MapTiles.createTownDiv);
    },
    checkAutoRelogin: function () {
        if (typeof $.cookie('pid') !== 'undefined' && typeof $.cookie('ig_conv_last_site') !== 'undefined') {
            var world = $.cookie('ig_conv_last_site').match(/\/\/(.*?)\.grepolis\.com/g)[0].replace('//', '').replace('.grepolis.com', '');
        }
    }
};

(function () {
    String.prototype.capitalize = function () {
        return this.charAt(0).toUpperCase() + this.slice(1);
    };
    String.prototype.replaceAll = function (search, replacement) {
        return this.replace(new RegExp(search, 'g'), replacement);
    };
    $.fn.serializeObject = function () {
        var obj = {};
        var arr = this.serializeArray();
        $.each(arr, function () {
            if (obj[this.name] !== undefined) {
                if (!obj[this.name].push) {
                    obj[this.name] = [obj[this.name]];
                }
                obj[this.name].push(this.value || '');
            } else {
                obj[this.name] = this.value || '';
            }
        });
        return obj;
    };
    
    var interval = setInterval(function () {
        if (window !== undefined) {
            if ($('.nui_main_menu').length && !$.isEmptyObject(ITowns.towns)) {
                clearInterval(interval);
                Autobot.initWindow();
                Autobot.initMapTownFeature();

                $.when(
                    $.getScript(Autobot.domain + 'DataExchanger.js'),
                    $.getScript(Autobot.domain + 'ConsoleLog.js'),
                    $.getScript(Autobot.domain + 'FormBuilder.js'),
                    $.getScript(Autobot.domain + 'ModuleManager.js'),
                    $.getScript(Autobot.domain + 'Assistant.js'),
                    $.Deferred(function (def) { def.resolve(); })
                ).done(function () {
                    Autobot.init();
                });
            } else {
                if (/grepolis\.com\/start\?nosession/g.test(window.location.href)) {
                    clearInterval(interval);
                    $.when(
                        $.getScript(Autobot.domain + 'DataExchanger.js'),
                        $.getScript(Autobot.domain + 'Redirect.js'),
                        $.Deferred(function (def) { def.resolve(); })
                    ).done(function () {
                        Autobot.checkAutoRelogin();
                    });
                }
            }
        }
    }, 100);
})();
