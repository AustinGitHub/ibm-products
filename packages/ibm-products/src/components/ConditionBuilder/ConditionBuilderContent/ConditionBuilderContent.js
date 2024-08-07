import React, { useCallback, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@carbon/react';
import { Add, TextNewLine } from '@carbon/react/icons';
import ConditionGroupBuilder from '../ConditionGroupBuilder/ConditionGroupBuilder';
import {
  ConditionBuilderContext,
  emptyState,
} from '../ConditionBuilderContext/ConditionBuilderProvider';
import { blockClass } from '../ConditionBuilderContext/DataConfigs';
import { ConditionBuilderButton } from '../ConditionBuilderButton/ConditionBuilderButton';
import uuidv4 from '../../../global/js/utils/uuidv4';
import ConditionPreview from '../ConditionPreview/ConditionPreview';
import { Heading } from '@carbon/react';
import { Section } from '@carbon/react';
import GroupConnector from '../ConditionBuilderConnector/GroupConnector';
import ConditionBuilderActions from '../ConditionBuilderActions/ConditionBuilderActions';
import { useTranslations } from '../utils/useTranslations';

const ConditionBuilderContent = ({
  startConditionLabel,
  getConditionState,
  getActionsState,
  initialState,
  actions,
}) => {
  const { rootState, setRootState, variant, actionState } = useContext(
    ConditionBuilderContext
  );
  const [isConditionBuilderActive, setIsConditionBuilderActive] =
    useState(false);
  const [showConditionGroupPreview, setShowConditionGroupPreview] =
    useState(false);

  const [addConditionGroupText, conditionHeadingText] = useTranslations([
    'addConditionGroupText',
    'conditionHeadingText',
  ]);
  const showConditionGroupPreviewHandler = () => {
    setShowConditionGroupPreview(true);
  };

  const hideConditionGroupPreviewHandler = () => {
    setShowConditionGroupPreview(false);
  };

  useEffect(() => {
    if (rootState?.groups?.length) {
      setIsConditionBuilderActive(true);
    } else {
      setIsConditionBuilderActive(false);
    }

    if (getConditionState) {
      getConditionState(rootState);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootState]);

  useEffect(() => {
    getActionsState?.(actionState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionState]);
  const onStartConditionBuilder = () => {
    //when add condition button is clicked.
    setIsConditionBuilderActive(true);
    setRootState(initialState ?? emptyState); //here we can set an empty skeleton object for an empty condition builder,
    //or we can even pre-populate some existing builder and continue editing
  };

  const onRemove = useCallback(
    (groupId) => {
      setRootState({
        ...rootState,
        groups: rootState.groups.filter((group) => groupId !== group.id),
      });
    },
    [setRootState, rootState]
  );

  const onChangeHandler = (updatedGroup, groupIndex) => {
    /**
     * This method is triggered from inner components. This will be called every time when any change is to be updated in the rootState.
     * This gets the updated group as argument.
     */
    const groups = [
      ...rootState.groups.slice(0, groupIndex),
      updatedGroup,
      ...rootState.groups.slice(groupIndex + 1),
    ];
    setRootState({
      ...rootState,
      groups,
    });
  };

  const addConditionGroupHandler = () => {
    const newGroup = {
      groupOperator: 'and', //'and|or',
      statement: 'if', // 'if|exclude if',
      id: uuidv4(),
      conditions: [
        {
          property: undefined,
          operator: '',
          value: '',
          popoverToOpen: 'propertyField',
          id: uuidv4(),
        },
      ],
    };
    setRootState({
      ...rootState,
      groups: [...rootState.groups, newGroup],
    });
  };

  const getColorIndex = () => {
    const groupLength = rootState?.groups?.length ?? 0;
    return groupLength % 5;
  };

  if (!isConditionBuilderActive) {
    return (
      <Button
        className={`${blockClass}__addConditionText-button`}
        renderIcon={(props) => <Add {...props} />}
        iconDescription={startConditionLabel}
        kind="ghost"
        size="sm"
        onClick={onStartConditionBuilder}
      >
        {startConditionLabel}
      </Button>
    );
  }

  return (
    <>
      <Section className={`${blockClass}__heading`} level={4}>
        <Heading>{conditionHeadingText}</Heading>
      </Section>

      <div
        className={`${blockClass}__content-container`}
        role="treegrid"
        aria-label="condition builder tree"
      >
        {rootState &&
          rootState?.groups?.map((eachGroup, groupIndex) => (
            <div key={eachGroup.id} className={`${blockClass}__group-wrapper`}>
              <ConditionGroupBuilder
                className={`${blockClass}__group`}
                aria={{
                  level: 1,
                  posinset: groupIndex * 2 + 1,
                  setsize: rootState.groups.length * 2,
                }}
                group={eachGroup}
                onRemove={() => {
                  onRemove(eachGroup.id);
                }}
                onChange={(updatedGroup) => {
                  onChangeHandler(updatedGroup, groupIndex);
                }}
              />

              {/* displaying the connector field between groups */}
              {groupIndex < rootState.groups.length - 1 && <GroupConnector />}
            </div>
          ))}

        {/* button to add a new group */}
        {variant == 'tree' && (
          <div
            role="row"
            tabIndex={-1}
            aria-level={1}
            className={`${blockClass}__add-group`}
          >
            {
              <ConditionBuilderButton
                renderIcon={TextNewLine}
                onClick={addConditionGroupHandler}
                onMouseEnter={showConditionGroupPreviewHandler}
                onMouseLeave={hideConditionGroupPreviewHandler}
                onFocus={showConditionGroupPreviewHandler}
                onBlur={hideConditionGroupPreviewHandler}
                className={`${blockClass}__add-condition-group `}
                hideLabel
                label={addConditionGroupText}
                wrapperProps={{
                  role: 'gridcell',
                  'aria-label': addConditionGroupText,
                }}
              />
            }
          </div>
        )}
        {showConditionGroupPreview && (
          <ConditionPreview
            previewType="newGroup"
            colorIndex={getColorIndex()}
            group={{ groupOperator: rootState.operator }}
          />
        )}
      </div>
      {actions && (
        <ConditionBuilderActions
          actions={actions}
          className={`${blockClass}__actions-container`}
          variant={variant}
        />
      )}
    </>
  );
};

export default ConditionBuilderContent;

ConditionBuilderContent.propTypes = {
  /**
   * optional array of object that give the list of actions.
   */
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  /**
   * callback functions that will provide the updated action state back.
   */
  getActionsState: PropTypes.func,
  /**
   * This is a callback function that returns the updated state
   */
  getConditionState: PropTypes.func.isRequired,
  /**
   * Optional prop if the condition building need to start from a predefined initial state
   */
  initialState: PropTypes.shape({
    groups: PropTypes.arrayOf(
      PropTypes.shape({
        groupOperator: PropTypes.string.isRequired,
        statement: PropTypes.string.isRequired,
        conditions: PropTypes.arrayOf(
          PropTypes.oneOfType([
            PropTypes.shape({
              property: PropTypes.string.isRequired,
              operator: PropTypes.string.isRequired,
              value: PropTypes.oneOfType([
                PropTypes.string,
                PropTypes.arrayOf(
                  PropTypes.shape({
                    id: PropTypes.string,
                    label: PropTypes.string,
                  })
                ),
                PropTypes.shape({
                  id: PropTypes.string,
                  label: PropTypes.string,
                }),
              ]),
            }),
            PropTypes.object,
          ])
        ),
      })
    ),
    operator: PropTypes.string,
  }),
  /* Provide a label to the button that starts condition builder
   */
  startConditionLabel: PropTypes.string.isRequired,
};
