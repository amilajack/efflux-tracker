zTracker
========

What is it ?
------------

zTracker is a JavaScript-based application that allows users to create music using user defined
WaveTable synthesis, all inside a browser.

Feature list
------------

- Create custom waveforms for multiple synth instruments
- Directly edit instrument output using the pattern editor
- Copy / clone patterns for nice and easy arranging
- Save songs locally to continue working on them later or export / import them between devices
- Input notes using a MIDI controller and/or record them live during playback

Sounds cool, but I don't want to build from source, I just want to tinker with this!!
-------------------------------------------------------------------------------------

Of course, it was made to allow for easy composition, so let's cut the chatter!
You can use the application right now from  your web browser by visiting [this link](http://www.igorski.nl/experiment/ztracker).

Project outline
---------------

All sources can be found in the _./src_-folder.

 * _./src/assets_ contains all CSS style declarations in .less format as well fonts
 * _./src/js_ contains all JavaScript sourcecode with _main.js_ being the application entry point
 * _./src/workers_ contains all JavaScript Workers (will be served as separate files when requested)
 * _./src/templates_ contains all HMTL snippets used by the application in Handlebars format
 * _./src/public_html_ contains the main HTML page that will link to the source output
 
The build scripts are defined in _./Gruntfile.js_ and includes snippets defined in the _./config_-folder.
 
Build instructions
------------------

To build zTracker first resolve all dependencies using Node:

    npm install
 
After which a development mode can be started (which conveniently opens your browser and points it to the correct
location at _http://localhost:3000_) using the following Grunt command:

    grunt dev
 
A production build (minimizes CSS and JS output size) can be created using the following Grunt command:

    grunt build
 
After which the build output is available in the _./dist/prod_-folder.
 
Unit testing
------------

Unit tests are run via Mocha, which is installed as a dependency. You can run the tests by using:

    npm test
 
Unit tests go in the _./test_-folder. The file name for a unit test must be equal to the file it is testing, but contain
the suffix "_.test_", e.g. _Functions.js_ will have a test file _Functions.test.js_.

NOTE : Node v 4.0 or higher must be installed for running the tests (these depend on jsdom)

TODO
----

 * Add modulator parameters for: filter enabled / freq / q, delay enabled / delay time / feedback / cutoff / offset
 * Move active pattern selectors to transport controls
 * Add close button to instrument and settings editor
 * Implement audio export
 * Create fixtures

NICE TO HAVES
-------------

 * Improve arrow key navigation within patterns
 * When saving songs, don't save empty custom waveforms (add an empty check, not an "was enabled"-check!)
 * Add overdrive (npm: wa-overdrive)
 * When selecting notes in noteEntry popup sound note when making changes to note / octave
 
KNOWN BUGS
----------

 * When copy-pasting an existing pattern into a new pattern, the new pattern is silent (has to do with
   start measure and measure offset!)
 * Pitch glides don't always work (see glideit2.ztk)
 * When adding a note to a track, by default it should use the instrument of the previous note in the lane
   