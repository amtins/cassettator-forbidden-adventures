const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const videojsVersions = () => {
    return fetch('https://api.cdnjs.com/libraries/video.js?fields=versions,latest')
        .then(response => response.json())
        .then(({ versions }) => versions.filter((version) => version.startsWith('7')))
        .then(versions => versions.reverse());
}

const versionOptions = (versions = [], defaultVersion) => {
    const fragment = document.createDocumentFragment();

    versions.forEach(version => {
        const option = document.createElement('option');
        option.textContent = version;
        option.value = version;


        if (`@${version}` === defaultVersion) {
            option.selected = true
        }

        fragment.appendChild(option);

    });

    if (versions.length) {
        $('.versions').appendChild(fragment);
    }
}

const videojsCssLoader = (version) => {
    const link = document.createElement('link');
    const css = `https://unpkg.com/video.js${version}/dist/video-js.css`;

    link.rel = 'stylesheet';
    link.href = css;

    document.head.appendChild(link);
}

const videojsScriptLoader = (version, callback) => {
    const videojsScript = document.createElement('script');
    const src = `https://unpkg.com/video.js${version}/dist/video.js`;

    videojsScript.async = true;
    videojsScript.defer = 'defer';
    videojsScript.src = src;
    videojsScript.type = 'text/javascript';
    videojsScript.onload = callback;

    document.body.appendChild(videojsScript);
}

const emeScriptLoader = (callback) => {
    const emeScript = document.createElement('script');

    emeScript.async = true;
    emeScript.defer = 'defer';
    emeScript.src = 'https://cdn.jsdelivr.net/npm/videojs-contrib-eme@3.4.1/dist/videojs-contrib-eme.js';
    emeScript.type = 'text/javascript';
    emeScript.onload = callback;

    document.body.appendChild(emeScript);
}

const unitedState = (key, value, reload = false) => {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);

    window.history.pushState(null, null, url);

    if (reload) {
        window.location = url;
    }
}

const mimeTypeFinder = (mimeType) => {
    const [type] = mimeType.match(/mpd|m3u8/) || [];

    if (type) {
        return type.endsWith('mpd') ? 'DASH' : 'HLS';
    }

    return '📼';
}

const mimeTypeSelector = (mimeType) => {
    Array
        .from($$('.resource__mime-type option'))
        .find(option => option.label === mimeTypeFinder(mimeType))
        .selected = true;
}

const drmFinder = () => {
    if (!$('#enable-drm').checked) {
        return;
    }

    if ($('#drm-select').selectedIndex === 1) {
        return {
            'com.apple.fps.1_0': {
                certificateUri: $('#certificate').value,
                licenseUri: $('#license').value
            }
        };
    }

    return {
        'com.widevine.alpha': $('#license').value
    };
}

let player = undefined;

(async (x) => {
    const versions = await videojsVersions();
    const url = new URL(location.toString());
    const defaultVersion = url.searchParams.has('version') ? `@${url.searchParams.get('version')}` : `@${versions[0]}`;
    const mediaSource = url.searchParams.has('url') ? url.searchParams.get('url') : undefined;
    const superPowerActivation = $('audio');

    if (mediaSource) {
        $('.resource__url').value = mediaSource;
        mimeTypeSelector(mediaSource);
    }

    versionOptions(versions, defaultVersion);
    videojsCssLoader(defaultVersion);
    videojsScriptLoader(defaultVersion, () => {
        emeScriptLoader(() => {
            const options = {
                liveui: true,
                liveTracker: {
                    trackingThreshold: 120,
                    liveTolerance: 30,
                },
            };
            const source = {
                src: mediaSource ? mediaSource : 'https://wowzaec2demo.streamlock.net/live/bigbuckbunny/manifest_mpm4sav_mvtime.mpd',
                type: mediaSource ? $('.resource__mime-type').value : 'application/dash+xml',
                keySystems: drmFinder(),
            };

            player = new videojs('player', options);


            player.eme();
            player.poster('http://lorempixel.com/640/360/abstract/');
            player.src(source);

            $('.vhs').innerText = JSON.stringify(videojs?.VhsHandler?.version() || videojs.HlsSourceHandler.VERSION, null, 2);
            $('.versions').addEventListener('change', () => unitedState('version', $('.versions').value, true));
            $('.resource__url').addEventListener('input', () => mimeTypeSelector($('.resource__url').value));
            $('.resource__submit').addEventListener('click', () => {
                const url = $('.resource__url').value;

                if (url) {
                    mimeTypeSelector(url);
                    unitedState('url', url);

                    player.src({ src: url, type: $('.resource__mime-type').value, keySystems: drmFinder() });
                    console.log('currentSource', player.currentSource());
                }
            });
            $('.cassetator-hero').addEventListener('click', () => superPowerActivation.play());
            $('#enable-drm').addEventListener('change', () => {
                if ($('#enable-drm').checked) {
                    $('.drm__vendors').classList.add('drm__vendors--show');
                    return;
                }

                $('.drm__vendors').classList.remove('drm__vendors--show');
            });
            $('#drm-select').addEventListener('change', () => {
                if ($('#drm-select').selectedIndex === 1) {
                    $('.drm__certificate-label').classList.remove('hide');
                    return;
                }

                $('.drm__certificate-label').classList.add('hide');
            });
        });
    });


    const drmCompatibilityLog = [];
    const hdcpCompatibilityLog = [];
    const robustnessLevel = [
        { robustness: 'SW_SECURE_CRYPTO', level: 'L3' },
        { robustness: 'SW_SECURE_DECODE', level: 'L3' },
        { robustness: 'HW_SECURE_CRYPTO', level: 'L2' },
        { robustness: 'HW_SECURE_DECODE', level: 'L1' },
        { robustness: 'HW_SECURE_ALL', level: 'L1' },
    ];
    const keySystems = ['com.widevine.alpha', 'com.microsoft.playready', 'com.apple.fps.1_0'];
    const hdcpVersions = ['1.0', '1.1', '1.2', '1.3', '1.4', '2.0', '2.1', '2.2', '2.3'];
    const videoCodecs = [
        { 'contentType': 'video/mp4;codecs="avc1.42800C"' },
        { 'contentType': 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"' },
        { 'contentType': 'video/mp4; codecs="avc1.58A01E, mp4a.40.2"' },
        { 'contentType': 'video/mp4; codecs="avc1.4D401E, mp4a.40.2"' },
        { 'contentType': 'video/mp4; codecs="avc1.64001E, mp4a.40.2"' },
        { 'contentType': 'video/mp4; codecs="avc1.64001E, mp4a.40.2"' },
        { 'contentType': 'video/mp4; codecs=av01.0.04M.08' },
        { 'contentType': 'video/mp4; codecs="av01.0.04M.08, mp4a.40.2"' },
        { 'contentType': 'video/mp4; codecs="av01.0.04M.08, opus"' },
        { 'contentType': 'video/webm' },
        { 'contentType': 'video/webm; codecs=vorbis' },
        { 'contentType': 'video/webm; codecs=vp8' },
        { 'contentType': 'video/webm; codecs=vp8.0' },
        { 'contentType': 'video/webm; codecs="vp8, vorbis"' },
        { 'contentType': 'video/webm; codecs=vp9' },
        { 'contentType': 'video/webm; codecs=vp9.0' },
        { 'contentType': 'video/webm; codecs=vp09.00.10.08' },
    ];
    const config = [
        {
            'initDataTypes': [
                'cenc'
            ],
            'persistentState': 'optional',
            'distinctiveIdentifier': 'optional',
            'sessionTypes': [
                'temporary'
            ],
            'audioCapabilities': [
                {
                    'robustness': 'SW_SECURE_CRYPTO',
                    'contentType': 'audio/mp4;codecs="mp4a.40.2"'
                }
            ],
            videoCapabilities: videoCodecs
        }
    ];

    const printDRM = (value) => {
        drmCompatibilityLog.push(value);
        $('.drm-compatibility').innerHTML = drmCompatibilityLog.sort().reverse().join('\n');
    }

    const printHDCP = (value) => {
        hdcpCompatibilityLog.push(value);
        $('.hdcp-compatibility').innerHTML = hdcpCompatibilityLog.join('\n');
    }

    const drmSecurityLevel = (keySystem, config, robustness, level) => {
        try {
            navigator
                .requestMediaKeySystemAccess(keySystem, config)
                .then((keySystemAccess) => {
                    return keySystemAccess.createMediaKeys();
                })
                .then((mediaKeys) => {
                    printDRM(`<span class='ok'>[OK] ${level} ${robustness}\t ${keySystem}</span>`);
                })
                .catch((e) => {
                    printDRM(`<span class='ko'>[KO] ${level} ${robustness} ${keySystem}</span>`);
                });
        } catch (e) {
            console.log('no widevine support');
            console.log(e);
        }
    };

    const hdcpLevel = (keySystem, config, hdcpVersion) => {
        try {
            navigator
                .requestMediaKeySystemAccess(keySystem, config)
                .then((keySystemAccess) => {
                    return keySystemAccess.createMediaKeys();
                })
                .then(async (mediaKeys) => {
                    if (('getStatusForPolicy' in mediaKeys)) {
                        const status = await mediaKeys.getStatusForPolicy({ hdcpVersion });
                        console.log('STATUS', status);
                        if (status === 'usable') {
                            printHDCP(`<span class='ok'>[OK] HDPC v${hdcpVersion} compatible</span>`);
                            return;
                        }
                    }
                    return Promise.reject(`[KO] HDPC v${hdcpVersion} not compatible`);
                })
                .catch((e) => {
                    if(typeof e ==='string')
                        printHDCP(`<span class='ko'>${e}</span>`);
                });
        } catch (e) {
            console.log('HDCP not supported');
            console.log(e);
        }
    };

    robustnessLevel.forEach(({ robustness, level }) => {
        config[0].videoCapabilities.forEach(vc => {
            vc.robustness = robustness;
        });

        keySystems.forEach(keySystem => {
            drmSecurityLevel(keySystem, config, robustness, level);
        });
    });

    hdcpVersions.forEach(hdcpVersion => {
        config[0].videoCapabilities[0].robustness = 'SW_SECURE_CRYPTO';

        keySystems.forEach(keySystem => {
            hdcpLevel(keySystem, config, hdcpVersion);
        });

    });
})();