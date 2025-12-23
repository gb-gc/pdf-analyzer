import PropTypes from 'prop-types';

const FieldList = ({
  fields,
  search,
  hasAnyFields,
  onSearchChange,
  selectedFieldId,
  hoveredFieldId,
  onSelectField,
  onHoverField,
  onEditField,
  onExportJson,
  onExportCsv,
}) => {
  const hasFilters = Boolean(search.trim());

  return (
    <aside className="field-list">
      <div className="field-list__header">
        <div>
          <label className="field-list__label" htmlFor="field-search">
            Search fields
          </label>
          <input
            id="field-search"
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Name, type, or value..."
          />
        </div>
        <div className="field-list__actions">
          <button type="button" onClick={onExportJson} disabled={!hasAnyFields}>
            Export JSON
          </button>
          <button type="button" onClick={onExportCsv} disabled={!hasAnyFields}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="field-list__items">
        {fields.length === 0 ? (
          <p className="field-list__empty">
            {hasFilters
              ? 'No matching fields.'
              : 'No interactive fields detected in this PDF.'}
          </p>
        ) : (
          fields.map((field) => {
            const isSelected = selectedFieldId === field.id;
            const isHovered = hoveredFieldId === field.id;
            return (
              <div
                key={field.id}
                className={`field-list__item${
                  isSelected ? ' field-list__item--selected' : ''
                }${isHovered ? ' field-list__item--hovered' : ''}`}
                onMouseEnter={() => onHoverField(field.id)}
                onMouseLeave={() => onHoverField(null)}
                onClick={() => onSelectField(field.id)}
                role="presentation"
              >
                <div className="field-list__item-top">
                  <span className="field-list__item-page">
                    Page {field.pageIndex + 1}
                  </span>
                  <span className="field-list__item-type">{field.type}</span>
                </div>
                <label className="field-list__item-label" htmlFor={`name-${field.id}`}>
                  Label
                  <input
                    id={`name-${field.id}`}
                    value={field.name || ''}
                    onChange={(event) =>
                      onEditField(field.id, { name: event.target.value })
                    }
                    onClick={(event) => event.stopPropagation()}
                  />
                </label>
                <label className="field-list__item-label" htmlFor={`value-${field.id}`}>
                  Value
                  <input
                    id={`value-${field.id}`}
                    value={field.value || ''}
                    placeholder="(empty)"
                    onChange={(event) =>
                      onEditField(field.id, { value: event.target.value })
                    }
                    onClick={(event) => event.stopPropagation()}
                  />
                </label>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};

FieldList.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      pageIndex: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string,
      value: PropTypes.string,
    }),
  ).isRequired,
  search: PropTypes.string.isRequired,
  hasAnyFields: PropTypes.bool.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  selectedFieldId: PropTypes.string,
  hoveredFieldId: PropTypes.string,
  onSelectField: PropTypes.func.isRequired,
  onHoverField: PropTypes.func.isRequired,
  onEditField: PropTypes.func.isRequired,
  onExportJson: PropTypes.func.isRequired,
  onExportCsv: PropTypes.func.isRequired,
};

FieldList.defaultProps = {
  selectedFieldId: null,
  hoveredFieldId: null,
};

export default FieldList;
