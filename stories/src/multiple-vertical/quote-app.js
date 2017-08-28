// @flow
import React, { Component } from 'react';
import styled, { injectGlobal } from 'styled-components';
import { action } from '@storybook/addon-actions';
import { DragDropContext } from '../../../src/';
import QuoteList from './quote-list';
import { colors, grid } from '../constants';
import reorder from '../reorder';
import type { Quote } from '../types';
import type { DropResult, DragStart, DraggableLocation } from '../../../src/types';

const publishOnDragStart = action('onDragStart');
const publishOnDragEnd = action('onDragEnd');

const Root = styled.div`
  background-color: ${colors.blue.deep};
  box-sizing: border-box;
  padding: ${grid * 2}px;
  min-height: 100vh;

  /* flexbox */
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;

const Column = styled.div`

`;

const PushDown = styled.div`
  height: 200px;
`;

const ScrollContainer = styled.div`
  overflow: auto;
  height: 400px;
`;

const isDraggingClassName = 'is-dragging';

type GroupedQuotes = {
  alpha: Quote[],
  beta: Quote[],
  gamma: Quote[],
  delta: Quote[],
}

type Props = {|
  initial: GroupedQuotes,
  listStyle?: Object,
|}

type State = {|
  quotes: GroupedQuotes,
|}

const resolveDrop = (quotes: GroupedQuotes, source: DraggableLocation, destination: DraggableLocation): GroupedQuotes => {
  const newQuotes: GroupedQuotes = { ...quotes };

  const movedQuote = quotes[source.droppableId][source.index];

  Object.entries(newQuotes).forEach(([listId, listQuotes]: [string, Quote[]]) => {
    let newListQuotes = [...listQuotes];

    if (listId === source.droppableId) {
      newListQuotes = [
        ...newListQuotes.slice(0, source.index),
        ...newListQuotes.slice(source.index + 1),
      ];
    }

    if (listId === destination.droppableId) {
      newListQuotes = [
        ...newListQuotes.slice(0, destination.index),
        movedQuote,
        ...newListQuotes.slice(destination.index),
      ];
    }

    newQuotes[listId] = newListQuotes;
  });

  return newQuotes;
};

export default class QuoteApp extends Component {
  /* eslint-disable react/sort-comp */
  props: Props
  state: State

  state: State = {
    quotes: this.props.initial,
  };
  /* eslint-enable react/sort-comp */

  onDragStart = (initial: DragStart) => {
    publishOnDragStart(initial);
    // $ExpectError - body could be null?
    document.body.classList.add(isDraggingClassName);
  }

  onDragEnd = (result: DropResult) => {
    publishOnDragEnd(result);
    // $ExpectError - body could be null?
    document.body.classList.remove(isDraggingClassName);

    // // dropped outside the list
    if (!result.destination) {
      return;
    }

    const quotes = resolveDrop(this.state.quotes, result.source, result.destination);

    this.setState({ quotes });
  }

  componentDidMount() {
    // eslint-disable-next-line no-unused-expressions
    injectGlobal`
      body.${isDraggingClassName} {
        cursor: grabbing;
        user-select: none;
      }
    `;
  }

  render() {
    const { quotes } = this.state;
    const style = {
      ...this.props.listStyle,
      margin: '0 20px',
    };

    return (
      <DragDropContext
        onDragStart={this.onDragStart}
        onDragEnd={this.onDragEnd}
      >
        <Root>
          <Column>
            <QuoteList
              listId="alpha"
              listType="card"
              style={style}
              quotes={quotes.alpha}
            />
          </Column>
          <Column>
            <PushDown />
            <QuoteList
              listId="beta"
              listType="card"
              style={style}
              quotes={quotes.beta}
            />
            <ScrollContainer>
              <QuoteList
                listId="gamma"
                listType="card"
                style={style}
                quotes={quotes.gamma}
              />
            </ScrollContainer>
          </Column>
          <Column>
            <ScrollContainer>
              <QuoteList
                listId="delta"
                listType="card"
                style={style}
                quotes={quotes.delta}
              />
            </ScrollContainer>
          </Column>
        </Root>
      </DragDropContext>
    );
  }
}