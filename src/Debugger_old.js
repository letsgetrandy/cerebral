var React = require('react');
var Range = React.createFactory(require('./Range.js'));
var DOM = React.DOM;

var debuggerStyle = {
  position: 'absolute',
  fontFamily: 'Consolas, Verdana',
  fontSize: '14px',
  fontWeight: 'normal',
  right: 0,
  top: 0,
  width: '400px',
  height: '100%',
  padding: '15px',
  backgroundColor: '#333',
  color: '#666',
  overflowY: 'scroll',
  overflowX: 'hidden',
  boxSizing: 'border-box'
};

var LogLink = {
  textDecoration: 'underline',
  fontFamily: 'inherit',
  cursor: 'pointer'
};

var LockStateButton = {
  display: 'inline-block',
  fontFamily: 'Consolas, Verdana',
  boxSizing: 'border-box',
  verticalAlign: 'top',
  padding: '3px 5px',
  marginRight: '10px',
  height: '30px',
  backgroundColor: '#222',
  lineHeight: '20px',
  textAlign: 'center',
  cursor: 'pointer',
  border: '1px solid #444',
  borderRadius: '4px'
};

var StoreStateButton = {
  display: 'inline-block',
  verticalAlign: 'top',
  fontFamily: 'Consolas, Verdana',
  boxSizing: 'border-box',
  padding: '3px 5px',
  marginRight: '10px',
  height: '30px',
  backgroundColor: '#222',
  lineHeight: '20px',
  textAlign: 'center',
  cursor: 'pointer',
  border: '1px solid #444',
  borderRadius: '4px'
};

var MutationsStyle = {
  listStyleType: 'none',
  color: '#999',
  boxSizing: 'border-box',
  paddingLeft: '10px'
};

var ActionStyle = {
  listStyleType: 'none',
  paddingLeft: 0
};

var MutationStyle = {
  marginBottom: '5px',
  paddingBottom: '5px',
  paddingLeft: '5px'
};

var MutationArgsStyle = {
  fontSize: '0.75em',
  color: '#888'
};

var mutationColors = {
  set: '#f0ad4e',
  push: '#286090',
  splice: '#d9534f',
  merge: '#5cb85c',
  unset: '#d9534f'
};

var Debugger = React.createClass({
  contextTypes: {
    cerebral: React.PropTypes.object.isRequired
  },
  componentWillMount: function() {
    this.context.cerebral.on('eventStoreUpdate', this.update);
    this.context.cerebral.on('update', this.update);
  },
  componentWillUnmount: function() {
    this.context.cerebral.off('eventStoreUpdate', this.update);
    this.context.cerebral.off('update', this.update);
  },
  update: function() {
    this.forceUpdate();
  },
  travelThroughTime: function(value) {
    this.context.cerebral.remember(value - 1);
  },
  logPath: function(name, path, event) {
    event.preventDefault();
    var value = this.context.cerebral.get(path);
    console.log('CEREBRAL - ' + name + ':', value.toJS ? value.toJS() : value);
  },
  logArg: function(arg) {
    console.log(arg);
  },
  renderMutations: function() {
    var currentSignalIndex = this.context.cerebral.getMemoryIndex();
    var signals = this.context.cerebral.getMemories();
    var signal = signals[currentSignalIndex];

    if (!signal) {
      return null;
    }

    return signal.actions.map(function(action, index) {
      return DOM.li({
          key: index,
          style: {
            position: 'relative',
            borderTop: '1px solid #555',
            paddingTop: '15px',
            marginTop: '15px'
          }
        },
        DOM.h3({
            style: {
              position: 'absolute',
              top: '-17px',
              left: '10px',
              backgroundColor: '#333',
              padding: '0 10px 0 10px',
              margin: 0,
              color: '#555',
              fontSize: '1em'
            }
          }, (index + 1) + '. ' + action.name,
          DOM.small({
              style: {
                color: action.isAsync ? 'orange' : '#555'
              }
            },
            action.isAsync && this.context.cerebral.hasExecutingAsyncSignals() && index === signal.actions.length - 1 ?
            ' async action running' :
            action.isAsync ? ' async' :
            null
          ),
          DOM.small({
            style: {
              color: '#888'
            }
          }, action.signalName !== signal.name ? ' (' + action.signalName + ')' : null)
        ),
        DOM.ul({
            style: ActionStyle
          },
          action.mutations.map(function(mutation, index) {

            var mutationArgs = mutation.args.slice();
            var path = mutation.name === 'set' ? mutation.path.concat(mutationArgs.shift()) : mutation.path;
            var color = mutationColors[mutation.name];
            var pathName = path.length ? path.join('.') : '$root';

            return DOM.li({
                key: index,
                style: MutationStyle
              },
              DOM.strong(null,
                DOM.span({
                  style: {
                    color: color
                  }
                }, mutation.name),
                ' ',
                DOM.a({
                  style: LogLink,
                  onClick: this.logPath.bind(null, pathName, path)
                }, pathName),
                DOM.div({
                  style: MutationArgsStyle
                }, mutationArgs.map(function(mutationArg) {
                  var argString = JSON.stringify(mutationArg, index);
                  if (argString.length > 50) {
                    return DOM.a({
                      key: index,
                      style: {
                        cursor: 'pointer'
                      },
                      onClick: this.logArg.bind(null, mutationArg)
                    }, argString.substr(0, 50) + '...');
                  } else {
                    return argString;
                  }
                }, this))
              )
            );

          }, this)
        )
      );
    }, this);

    var mutations = this.context.cerebral.getMemories().mutations;
    return mutations.filter(function(mutation) {
        return mutation.signalIndex === signal.index;
      })
      .map(function(mutation, index) {

      });
  },
  renderFPS: function(duration) {

    var color = duration >= 16 ? '#d9534f' : duration >= 10 ? '#f0ad4e' : '#5cb85c';
    return DOM.strong(null, DOM.small({
      style: {
        color: color
      }
    }, ' (' + duration + 'ms)'));
  },
  reset: function() {
    this.context.cerebral.reset();
  },
  render: function() {
    var cerebral = this.context.cerebral;
    var value = cerebral.getMemoryIndex() + 1;
    var steps = cerebral.getMemories().length;
    var currentSignalIndex = this.context.cerebral.getMemoryIndex();
    var signals = this.context.cerebral.getMemories();
    var signal = signals[currentSignalIndex];
    var keepState = cerebral.willKeepState();
    var storeState = cerebral.willStoreState();
    var lockInput = cerebral.hasExecutingAsyncSignals() || !keepState;

    LockStateButton.backgroundColor = keepState ? '#d9534f' : '#222';
    LockStateButton.color = keepState ? 'white' : '#666';

    StoreStateButton.backgroundColor = storeState ? '#5cb85c' : '#222';
    StoreStateButton.color = storeState ? 'white' : '#666';

    return DOM.div({
        style: debuggerStyle
      },
      DOM.h1({
          style: {
            lineHeight: '30px',
            fontSize: '2em',
            color: '#999'
          }
        },
        'Cerebral Debugger '),
      DOM.h4(null,
        DOM.span({
          onClick: cerebral.toggleKeepState,
          style: LockStateButton
        }, 'record'),
        DOM.span({
          onClick: cerebral.toggleStoreState,
          style: StoreStateButton
        }, 'store'),
        DOM.span({
          style: {
            height: '30px',
            lineHeight: '30px',
            fontSize: '0.9em',
            color: '#999'
          }
        }, value + ' / ' + steps + ' - ', DOM.a({
          onClick: this.reset,
          style: {
            textDecoration: cerebral.hasExecutingAsyncSignals() ? 'none' : 'underline',
            cursor: cerebral.hasExecutingAsyncSignals() ? 'default' : 'pointer',
            color: cerebral.hasExecutingAsyncSignals() ? '#444' : '#888'
          }
        }, 'reset'))
      ),
      Range({
        onChange: this.travelThroughTime,
        disabled: lockInput,
        value: value,
        steps: steps
      }),
      DOM.h2({
        style: {
          color: '#999',
          marginBottom: '25px',
          fontSize: '1.25em'
        }
      }, signal ? DOM.span(null, signal.name, this.renderFPS(signal.duration)) : null),
      DOM.ul({
        style: MutationsStyle
      }, this.renderMutations())
    );
  }
});

module.exports = Debugger;
