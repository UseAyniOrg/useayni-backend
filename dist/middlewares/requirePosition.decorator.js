"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequirePosition = exports.REQUIRE_POSITION_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.REQUIRE_POSITION_KEY = 'requirePosition';
const RequirePosition = (type, contextId) => (0, common_1.SetMetadata)(exports.REQUIRE_POSITION_KEY, { type, contextId });
exports.RequirePosition = RequirePosition;
