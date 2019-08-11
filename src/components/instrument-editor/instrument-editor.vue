/**
* The MIT License (MIT)
*
* Igor Zinken 2019 - https://www.igorski.nl
*
* Permission is hereby granted, free of charge, to any person obtaining a copy of
* this software and associated documentation files (the 'Software'), to deal in
* the Software without restriction, including without limitation the rights to
* use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
* the Software, and to permit persons to whom the Software is furnished to do so,
* subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
* FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
* COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
* IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
* CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
<template>
    <div class="instrument-editor">
        <div class="header">
            <h2>Instrument editor</h2>
            <button class="help-button"
                    @click="openHelp">?</button>
            <button class="close-button"
                    @click="$emit('close')">x</button>

            <!-- selector that switches between available instruments -->
            <select class="instrument-selector"
                    v-model.number="instrument"
            >
                <option v-for="(instrument, idx) in instrumentAmount"
                        :key="`instrument_${idx}`"
                        :value="idx"
                >Instrument {{ instrument }}</option>
            </select>
        </div>

        <!-- part 1 : oscillator editor -->
        <ul class="oscillator-tabs tab-list">
            <li v-for="(oscillator, idx) in oscillatorAmount"
                :key="`oscillator_${idx}`"
                :class="{ active: selectedOscillatorIndex === idx }"
                @click="setSelectedOscillatorIndex(idx)"
            >
                Oscillator {{ idx + 1 }}
            </li>
        </ul>
        <div>
            <oscillator-editor
                :instrument-ref="instrumentRef"
                :instrument-id="selectedInstrument"
                :oscillator-index="selectedOscillatorIndex"
                @invalidate="invalidatePreset"
            />

            <!-- part 2: modules -->
            <module-editor
                :instrument-ref="instrumentRef"
                :instrument-id="selectedInstrument"
                @invalidate="invalidatePreset"
            />
        </div>

        <section class="instrument-presets">
            <h2>Presets</h2>
            <select v-model="currentPreset">
                <option v-for="(instrument, idx) in presets"
                        :key="`preset_${idx}`"
                        :value="instrument.presetName"
                >{{ instrument.presetName }}</option>
            </select>
            <div class="save">
                <input v-model="presetName"
                       class="preset-name-input"
                       type="text"
                       placeholder="preset name"
                       @focus="handleFocusIn"
                       @blur="handleFocusOut"
                       @keyup.enter="savePreset"
                />
                <button type="button"
                        @click="savePreset"
                >Save preset</button>
            </div>
        </section>
    </div>
</template>

<script>
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex';
import Config from '../../config';
import ManualURLs from '../../definitions/manual-urls';
import AudioService from '../../services/audio-service';
import PubSubMessages from '../../services/pubsub/messages';
import InstrumentFactory from '../../model/factory/instrument-factory';
import OscillatorEditor from './components/oscillator-editor';
import ModuleEditor from './components/module-editor';
import ObjectUtil from '../../utils/object-util';

let EMPTY_PRESET_VALUE;

export default {
    components: {
        OscillatorEditor,
        ModuleEditor
    },
    data: () => ({
        instrumentAmount: Config.INSTRUMENT_AMOUNT,
        oscillatorAmount: Config.OSCILLATOR_AMOUNT,
        currentPreset: null
    }),
    computed: {
        ...mapState({
            activeSong: state => state.song.activeSong,
            selectedInstrument: state => state.editor.selectedInstrument,
            selectedOscillatorIndex: state => state.editor.selectedOscillatorIndex,
            instruments: state => state.instrument.instruments
        }),
        ...mapGetters([
            'getCopy',
            'getInstrumentByPresetName'
        ]),
        instrument: {
            get() {
                return this.selectedInstrument;
            },
            set(value) {
                this.setSelectedInstrument(value); // allows live keyboard/MIDI playing to use new instrument
                const instrumentPresetName = this.instrumentRef.presetName;
                if (this.presets.find(({ presetName }) => presetName === instrumentPresetName)) {
                    this.currentPreset = instrumentPresetName;
                } else {
                    this.currentPreset = EMPTY_PRESET_VALUE;
                }
            },
        },
        instrumentRef() {
            return this.activeSong.instruments[this.selectedInstrument];
        },
        presets() {
            const out = [
                ...this.instruments,
                { presetName: this.getCopy('INPUT_PRESET')}
            ];
            return out.sort(( a, b ) => {
                if( a.presetName < b.presetName ) return -1;
                if( a.presetName > b.presetName ) return 1;
                return 0;
            });
        },
        presetName: {
            get() {
                return this.instrumentRef.presetName;
            },
            set(value) {
                this.setPresetName({ instrument: this.instrumentRef, presetName: value });
            },
        },
    },
    watch: {
        currentPreset(selectedPresetName) {
            if (selectedPresetName !== EMPTY_PRESET_VALUE &&
                this.instrumentRef.presetName !== selectedPresetName) {
                const instrumentPreset = this.getInstrumentByPresetName(selectedPresetName);
                if (!instrumentPreset) {
                    return;
                }
                const newInstrument = InstrumentFactory.loadPreset(
                    instrumentPreset, this.selectedInstrument, this.instrumentRef.name
                );
                this.replaceInstrument({ instrumentIndex: this.selectedInstrument, instrument: newInstrument });
                this.presetName = selectedPresetName;
                this.setSelectedOscillatorIndex(0);
                AudioService.cacheAllOscillators(this.selectedInstrument, newInstrument);
                AudioService.applyModules(this.activeSong);
            }
        },
    },
    created() {
        EMPTY_PRESET_VALUE = this.getCopy('INPUT_PRESET');
        this.instrument = this.selectedInstrument; // last active instrument in editor will be opened
        this.publishMessage(PubSubMessages.INSTRUMENT_EDITOR_OPENED);
    },
    methods: {
        ...mapMutations([
            'setSelectedInstrument',
            'setSelectedOscillatorIndex',
            'suspendKeyboardService',
            'showError',
            'showNotification',
            'updateInstrument',
            'replaceInstrument',
            'setPresetName',
            'publishMessage'
        ]),
        ...mapActions([
            'saveInstrument'
        ]),
        openHelp() {
            window.open(ManualURLs.INSTRUMENT_EDITOR_HELP, '_blank');
        },
        invalidatePreset() {
            if (this.instrumentRef.presetName && !this.instrumentRef.presetName.includes('*')) {
                this.presetName = `${this.instrumentRef.presetName}*`;
            }
        },
        savePreset() {
            const newPresetName = this.presetName || '';
            if (newPresetName.trim().length === 0) {
                this.showError(this.getCopy('ERROR_NO_INS_NAME'));
            }
            else {
                this.presetName = newPresetName.replace('*', '');
                if (this.saveInstrument( ObjectUtil.clone( this.instrumentRef ) )) {
                    this.showNotification({ message: this.getCopy('INSTRUMENT_SAVED', newPresetName ) });
                }
            }
        },
        /**
         * when typing, we want to suspend the KeyboardController
         * so it doesn't broadcast the typing to its listeners
         */
        handleFocusIn() {
            this.suspendKeyboardService(true);
        },
        /**
         * on focus out, restore the KeyboardControllers broadcasting
         */
        handleFocusOut() {
            this.suspendKeyboardService(false);
        },
    }
};
</script>

<style lang='scss' scoped>
    @import '@/styles/_layout.scss';

    .instrument-editor {
      @include editorComponent();
      @include overlay();
      height: auto;
    }

    .instrument-selector {
      position: absolute;
      top: $spacing-small;
      right: ($spacing-xlarge + $spacing-xlarge);
    }

    .instrument-presets {
      display: inline-block;
      width: 100%;
      margin-top: $spacing-small;

      .save {
        float: right;
        margin-right: $spacing-xlarge;
      }
    }

    /* ideal size and above (tablet/desktop) */

    @media screen and ( min-width: $ideal-instrument-editor-width ) {
      .instrument-editor {
        top: 50%;
        left: 50%;
        width: $ideal-instrument-editor-width;
        margin-left: -$ideal-instrument-editor-width / 2;
        margin-top: -$ideal-instrument-editor-height / 2;
      }
    }

    /* small screen / mobile, etc. */

    @media screen and ( max-height: $ideal-instrument-editor-height ), ( max-width: $ideal-instrument-editor-width ) {
      .instrument-editor {
        position: absolute;
        height: 100%;
        top: 0;
        margin-top: 0;
        @include verticalScrollOnMobile();
      }

      .instrument-selector {
        top: $spacing-small;
      }

      .instrument-presets {
        @include boxSize();
        padding: 0 $spacing-large;

        h2 {
          width: 100%;
        }
        select {
          display: block;
          width: 100%;
          margin: 0 auto;
        }
        .save {
          float: none;
          margin-top: $spacing-medium;
          button {
            float: right;
          }
        }
      }

      .preset-name-input {
          width: calc(100% - 120px);
      }
    }
</style>
 