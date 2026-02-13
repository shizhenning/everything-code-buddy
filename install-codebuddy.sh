#!/bin/bash

# CodeBuddy ECC Installer
# Installs Everything Claude Code components for CodeBuddy

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CODEBUDDY_DIR=".codebuddy"
INSTALL_DIR="$HOME/.codebuddy"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════╗"
    echo "║     CodeBuddy ECC Installer v1.0                      ║"
    echo "║     Installing ECC for CodeBuddy                       ║"
    echo "╚═══════════════════════════════════════════════════════╝"
    echo ""
}

print_usage() {
    echo "Usage: $0 [OPTIONS] [LANGUAGES]"
    echo ""
    echo "OPTIONS:"
    echo "  --global        Install globally (default: project-level)"
    echo "  --target DIR    Target directory (default: .codebuddy)"
    echo "  --help          Show this help message"
    echo ""
    echo "LANGUAGES:"
    echo "  typescript      Install TypeScript rules"
    echo "  python         Install Python rules"
    echo "  golang         Install Go rules"
    echo ""
    echo "Examples:"
    echo "  $0 typescript"
    echo "  $0 --global typescript python"
    echo "  $0 --target ~/.codebuddy typescript"
}

install_components() {
    local target_dir="$1"
    
    log_info "Creating target directory: $target_dir"
    mkdir -p "$target_dir"
    
    # Install plugin.json
    log_info "Installing plugin.json..."
    cp "$PROJECT_ROOT/.codebuddy/plugin.json" "$target_dir/plugin.json"
    
    # Install Agents
    log_info "Installing Agents..."
    mkdir -p "$target_dir/agents"
    cp -r "$PROJECT_ROOT/agents"/*.md "$target_dir/agents/"
    local agent_count=$(ls -1 "$target_dir/agents"/*.md 2>/dev/null | wc -l)
    log_success "Installed $agent_count agents"
    
    # Install Commands
    log_info "Installing Commands..."
    mkdir -p "$target_dir/commands"
    cp -r "$PROJECT_ROOT/commands"/*.md "$target_dir/commands/"
    local command_count=$(ls -1 "$target_dir/commands"/*.md 2>/dev/null | wc -l)
    log_success "Installed $command_count commands"
    
    # Install Skills
    log_info "Installing Skills..."
    mkdir -p "$target_dir/skills"
    cp -r "$PROJECT_ROOT/skills"/* "$target_dir/skills/"
    local skill_count=$(find "$target_dir/skills" -name "SKILL.md" 2>/dev/null | wc -l)
    log_success "Installed $skill_count skills"
    
    # Install Hooks
    log_info "Installing Hooks configuration..."
    if [ -f "$PROJECT_ROOT/hooks/hooks.json" ]; then
        cp "$PROJECT_ROOT/hooks/hooks.json" "$target_dir/hooks.json"
        log_success "Installed hooks.json"
    else
        log_warning "hooks.json not found, skipping"
    fi
    
    # Install Scripts
    log_info "Installing Hook Scripts..."
    if [ -d "$PROJECT_ROOT/scripts" ]; then
        mkdir -p "$target_dir/scripts"
        cp -r "$PROJECT_ROOT/scripts"/* "$target_dir/scripts/"
        log_success "Installed hook scripts"
    fi
    
    # Install MCP Configs
    log_info "Installing MCP Configurations..."
    if [ -d "$PROJECT_ROOT/mcp-configs" ]; then
        mkdir -p "$target_dir/mcp-configs"
        cp -r "$PROJECT_ROOT/mcp-configs"/* "$target_dir/mcp-configs/"
        log_success "Installed MCP configs"
    fi
}

install_rules() {
    local target_dir="$1"
    shift
    local languages=("$@")
    
    log_info "Installing Rules..."
    
    mkdir -p "$target_dir/rules"
    
    # Always install common rules
    if [ -d "$PROJECT_ROOT/rules/common" ]; then
        cp -r "$PROJECT_ROOT/rules/common"/* "$target_dir/rules/"
        log_success "Installed common rules"
    else
        log_warning "Common rules directory not found"
    fi
    
    # Install language-specific rules
    if [ ${#languages[@]} -eq 0 ]; then
        log_warning "No languages specified, skipping language-specific rules"
    else
        for lang in "${languages[@]}"; do
            local lang_dir="$PROJECT_ROOT/rules/$lang"
            if [ -d "$lang_dir" ]; then
                cp -r "$lang_dir"/* "$target_dir/rules/"
                log_success "Installed $lang rules"
            else
                log_warning "Language '$lang' rules not found"
            fi
        done
    fi
    
    # Copy rules install guide
    if [ -f "$target_dir/rules/INSTALL.md" ]; then
        log_info "Rules installation guide: $target_dir/rules/INSTALL.md"
    fi
}

create_settings_json() {
    local target_dir="$1"
    
    log_info "Creating settings.json..."
    
    local settings_file="$target_dir/settings.json"
    
    # Base settings
    cat > "$settings_file" << 'EOF'
{
  "model": "sonnet",
  "permissions": {
    "Bash": "ask",
    "Edit": "accept",
    "Write": "accept"
  },
  "env": {
    "MAX_THINKING_TOKENS": "10000",
    "CODEBUDDY_AUTOCOMPACT_PCT_OVERRIDE": "50"
  }
}
EOF
    
    log_success "Created settings.json with default configuration"
}

update_paths_in_hooks() {
    local target_dir="$1"
    local hooks_file="$target_dir/settings.json"
    
    if [ ! -f "$hooks_file" ]; then
        log_warning "settings.json not found, skipping path updates"
        return
    fi
    
    log_info "Updating paths in hooks configuration..."
    
    # Use sed to replace CLAUDE_PLUGIN_ROOT with CODEBUDDY_PLUGIN_ROOT
    if command -v sed &> /dev/null; then
        sed -i 's/CLAUDE_PLUGIN_ROOT/CODEBUDDY_PLUGIN_ROOT/g' "$hooks_file"
        log_success "Updated environment variable references"
    else
        log_warning "sed not available, manual update may be needed"
    fi
}

# Parse arguments
GLOBAL_INSTALL=false
LANGUAGES=()

while [[ $# -gt 0 ]]; do
    case $1 in
        --global)
            GLOBAL_INSTALL=true
            INSTALL_DIR="$HOME/.codebuddy"
            shift
            ;;
        --target)
            INSTALL_DIR="$2"
            shift 2
            ;;
        --help)
            print_usage
            exit 0
            ;;
        typescript|python|golang)
            LANGUAGES+=("$1")
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            print_usage
            exit 1
            ;;
    esac
done

# Main installation
print_header

if [ "$GLOBAL_INSTALL" = true ]; then
    log_info "Installing globally to: $INSTALL_DIR"
else
    log_info "Installing locally to: $INSTALL_DIR"
fi

# Check if we're in the right directory
if [ ! -d "$PROJECT_ROOT/agents" ] || [ ! -d "$PROJECT_ROOT/commands" ]; then
    log_error "Not in ECC project root. Please run from the project root directory."
    exit 1
fi

# Install components
install_components "$INSTALL_DIR"

# Install rules
install_rules "$INSTALL_DIR" "${LANGUAGES[@]}"

# Create settings.json
create_settings_json "$INSTALL_DIR"

# Update hooks
if [ -f "$PROJECT_ROOT/hooks/hooks.json" ]; then
    # Merge hooks.json into settings.json
    log_info "Merging hooks configuration..."
    # For simplicity, just copy and let user review
    cp "$PROJECT_ROOT/hooks/hooks.json" "$INSTALL_DIR/hooks.json"
    update_paths_in_hooks "$INSTALL_DIR"
fi

# Print summary
echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                  Installation Complete                     ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
log_success "ECC components installed for CodeBuddy!"
echo ""
echo "Components installed:"
echo "  ✅ Agents:      $INSTALL_DIR/agents/"
echo "  ✅ Commands:    $INSTALL_DIR/commands/"
echo "  ✅ Skills:      $INSTALL_DIR/skills/"
echo "  ✅ Rules:       $INSTALL_DIR/rules/"
echo "  ✅ Hooks:       $INSTALL_DIR/settings.json (or hooks.json)"
echo "  ✅ Scripts:     $INSTALL_DIR/scripts/"
echo "  ✅ MCP Configs: $INSTALL_DIR/mcp-configs/"
echo ""
echo "Next steps:"
echo "  1. Review $INSTALL_DIR/settings.json"
echo "  2. Install rules to CodeBuddy rules directory:"
echo "     cp -r $INSTALL_DIR/rules/* ~/.codebuddy/rules/"
echo "  3. Test CodeBuddy:"
echo "     codebuddy /plan 'test feature'"
echo "  4. Read migration guide: docs/CODEBUDDY_MIGRATION_GUIDE.md"
echo ""
echo "Documentation:"
echo "  - CodeBuddy: https://www.codebuddy.cn/docs/cli/overview"
echo "  - Migration: docs/CODEBUDDY_MIGRATION_GUIDE.md"
echo ""
