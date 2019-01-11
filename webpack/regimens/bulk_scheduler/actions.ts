import { isNaN, isNumber } from "lodash";
import { t } from "i18next";
import { error, warning } from "farmbot-toastr";
import { ReduxAction, Thunk } from "../../redux/interfaces";
import { ToggleDayParams } from "./interfaces";
import { findSequence, findRegimen } from "../../resources/selectors";
import { groupRegimenItemsByWeek } from "./group_regimen_items_by_week";
import { defensiveClone } from "../../util";
import { overwrite } from "../../api/crud";
import { Actions } from "../../constants";
import { assertUuid } from "../../resources/util";
import { mergeVariableDeclarations } from "../../sequences/locals_list/declaration_support";

export function pushWeek() {
  return {
    type: Actions.PUSH_WEEK,
    payload: undefined
  };
}

export function popWeek() {
  return {
    type: Actions.POP_WEEK,
    payload: undefined
  };
}

export function deselectDays() {
  return {
    type: Actions.DESELECT_ALL_DAYS,
    payload: undefined
  };
}

export function selectDays() {
  return {
    type: Actions.SELECT_ALL_DAYS,
    payload: undefined
  };
}

/** Sets daily offset of a regimen */
export function setTimeOffset(ms: number) {
  if (isNaN(ms) || !isNumber(ms)) {
    warning(t("Time is not properly formatted."), t("Bad Input"));
    throw new Error("Bad time input on regimen page: " + JSON.stringify(ms));
  } else {
    return { type: Actions.SET_TIME_OFFSET, payload: ms };
  }
}

export function toggleDay({ week, day }: ToggleDayParams) {
  return {
    type: Actions.TOGGLE_DAY,
    payload: {
      week,
      day
    }
  };
}

export function setSequence(uuid: string | ""): ReduxAction<string> {
  if (uuid) {
    assertUuid("Sequence", uuid);
  }
  return { type: Actions.SET_SEQUENCE, payload: uuid };
}

/** A thunk that takes new edits in the Regimen editor and then commits them to
 * the active (open) regimen. Use case: A user is editing a regimen and they are
 * ready to save their work. */
export function commitBulkEditor(): Thunk {
  return function (dispatch, getState) {
    const resources = getState().resources;
    const { weeks, dailyOffsetMs, selectedSequenceUUID, currentRegimen } =
      resources.consumers.regimens;

    // If the user hasn't clicked a regimen, initialize one for them.
    if (currentRegimen) {
      // Proceed only if they selected a sequence from the drop down.
      if (selectedSequenceUUID) {
        const sequence =
          findSequence(resources.index, selectedSequenceUUID).body;
        const groupedItems = weeks.length > 0 ?
          groupRegimenItemsByWeek(weeks, dailyOffsetMs, sequence) : undefined;
        // Proceed only if days are selected in the scheduler.
        if (groupedItems && groupedItems.length > 0) {
          const regimen = findRegimen(resources.index, currentRegimen);
          const clonedRegimen = defensiveClone(regimen).body;
          clonedRegimen.regimen_items = clonedRegimen.regimen_items.concat(groupedItems);
          const varData = resources.index.sequenceMetas[selectedSequenceUUID];
          clonedRegimen.body = mergeVariableDeclarations(varData, regimen.body.body);
          dispatch(overwrite(regimen, clonedRegimen));
        } else {
          return error(t("No day(s) selected."));
        }
      } else {
        return error(t("Select a sequence from the dropdown first."), t("Error"));
      }
    } else {
      return error(t("Select a regimen first or create one."));
    }
  };
}
