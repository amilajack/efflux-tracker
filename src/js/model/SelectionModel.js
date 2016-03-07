/**
 * The MIT License (MIT)
 *
 * Igor Zinken 2016 - http://www.igorski.nl
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
module.exports = SelectionModel;

var ObjectUtil = require( "../utils/ObjectUtil" );

function SelectionModel()
{
    /* instance properties */

    /**
     * @public
     * @type {Array.<Array.<number>>}
     */
    this.selection = [
        [], []
    ];

    /**
     * @private
     * @type {Array.<Array<PATTERN_STEP>>}
     */
    this._copySelection = null;
}

/**
 * sets the selection for given channel to the range selectionStart - selectionEnd
 *
 * @public
 *
 * @param {number} activeChannel
 * @param {number} selectionStart
 * @param {number} selectionEnd
 */
SelectionModel.prototype.setSelection = function( activeChannel, selectionStart, selectionEnd )
{
    var prevLength    = this.getMinValue();
    var forceEqualize = this.selection[( activeChannel === 0 ) ? 1 : 0 ].length > 0;
    this.clearSelection();

    var patterns = this.selection[ activeChannel ];

    for ( var i = selectionStart; i < selectionEnd; ++i )
        patterns.push( i );

    if ( prevLength === 0 && patterns.length === 2 )
        forceEqualize = false;

    this.equalizeSelection( activeChannel, forceEqualize );
};

/**
 * equalize selection length for both channels (if the other channel
 * had a selection, or when force is true)
 *
 * @public
 *
 * @param {number} activeChannel
 * @param {boolean=} force optional defaults to false
 */
SelectionModel.prototype.equalizeSelection = function( activeChannel, force )
{
    // equalize selection length for both channels (if other channel had selection)

    if (( force === true ))
    {
        var currentChannel = this.selection[ activeChannel ];
        var otherChannel   = this.selection[ ( activeChannel === 0 ) ? 1 : 0 ];

        currentChannel.forEach( function( pattern, index )
        {
            if ( otherChannel.indexOf( pattern ) === -1 ) {
                otherChannel.push( pattern ) ;
            }
        });
    }
    this.sort();
};

/**
 * clears the current selection
 *
 * @public
 */
SelectionModel.prototype.clearSelection = function()
{
    this.selection = [ [], [] ];
};

/**
 * retrieve the maximum value contained in the selection
 *
 * @public
 * @return {number}
 */
SelectionModel.prototype.getMinValue = function()
{
    var val1 = Math.min.apply( Math, this.selection[ 0 ]);
    var val2 = Math.min.apply( Math, this.selection[ 1 ]);

    return Math.min( val1, val2 );
};

/**
 * retrieve the maximum value contained in the selection
 *
 * @public
 * @return {number}
 */
SelectionModel.prototype.getMaxValue = function()
{
    var val1 = Math.max.apply( Math, this.selection[ 0 ]);
    var val2 = Math.max.apply( Math, this.selection[ 1 ]);

    return Math.max( val1, val2 );
};

/**
 * @public
 * @return {number}
 */
SelectionModel.prototype.getSelectionLength = function()
{
    return Math.max( this.selection[ 0 ].length, this.selection[ 1 ].length );
};

/**
 * @public
 *
 * @param {Object} song
 * @param {number} activePattern
 */
SelectionModel.prototype.copySelection = function( song, activePattern )
{
    if ( this.getSelectionLength() > 0 )
    {
        this._copySelection = [ [], [] ];

        var pattern = song.patterns[ activePattern ];

        for ( var i = 0; i < 2; ++i )
        {
            if ( this.selection[ i ].length > 0 )
            {
                for ( var j = this.getMinValue(), l = this.getMaxValue(); j <= l; ++j )
                   this._copySelection[ i ].push( ObjectUtil.clone( pattern.channels[ i ][ j ]));
            }
        }
    }
};

/**
 * @public
 *
 * @param {Object} song
 * @param {number} activePattern
 * @param {number} activeChannel
 * @param {number} activeStep
 */
SelectionModel.prototype.pasteSelection = function( song, activePattern, activeChannel, activeStep )
{
    if ( this._copySelection !== null )
    {
        var target = song.patterns[ activePattern ];
        var source, writeIndex;

        for ( var i = activeChannel, j = 0; i < 2; ++i, ++j )
        {
            source = target.channels[ i ];

            this._copySelection[ j ].forEach( function( pattern, index )
            {
                writeIndex = activeStep + index;

                if ( writeIndex < source.length ) {
                    if ( pattern.sound !== 0 )
                        source[ writeIndex  ] = ObjectUtil.clone( pattern );
                }
            });
        }
    }
    this.clearSelection();
};

/* private methods */

SelectionModel.prototype.sort = function()
{
    var sortMethod = function( a, b ){ return a-b; };

    this.selection[ 0 ].sort( sortMethod );
    this.selection[ 1 ].sort( sortMethod );
};