// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @notice Identity Registry do padrão ERC-3643 (ADR-0001), simplificado para a POC.
/// Mantém quais carteiras possuem claims de KYC válidas e quais endereços são
/// Trusted Issuers autorizados a emiti-las. Nenhum dado pessoal é gravado on-chain
/// (ADR-0006) — apenas o resultado da verificação, como claim assinada off-chain.
contract IdentityRegistry is AccessControl {
    bytes32 public constant PLATFORM_ADMIN_ROLE = keccak256("PLATFORM_ADMIN_ROLE");
    bytes32 public constant KYC_APPROVED_TOPIC = keccak256("KYC_APPROVED");

    struct Claim {
        bool existe;
        address issuer;
    }

    mapping(address issuer => bool autorizado) private _trustedIssuers;
    address[] private _trustedIssuersList;

    mapping(address carteira => mapping(bytes32 topico => Claim)) private _claims;
    mapping(bytes32 assinaturaHash => bool usada) private _assinaturasUsadas;

    event TrustedIssuerAdicionado(address indexed issuer);
    event TrustedIssuerRemovido(address indexed issuer);
    event ClaimEmitida(address indexed carteira, bytes32 indexed topico, address indexed issuer);
    event ClaimRevogada(address indexed carteira, bytes32 indexed topico, address revogadoPor);

    error IssuerNaoAutorizado(address issuer);
    error AssinaturaJaUtilizada(bytes32 assinaturaHash);
    error RevogacaoNaoAutorizada(address chamador, address carteira, bytes32 topico);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PLATFORM_ADMIN_ROLE, msg.sender);
    }

    // ---- Funções de escrita ----

    function adicionarTrustedIssuer(address issuer) external onlyRole(PLATFORM_ADMIN_ROLE) {
        if (_trustedIssuers[issuer]) return;
        _trustedIssuers[issuer] = true;
        _trustedIssuersList.push(issuer);
        emit TrustedIssuerAdicionado(issuer);
    }

    function removerTrustedIssuer(address issuer) external onlyRole(PLATFORM_ADMIN_ROLE) {
        if (!_trustedIssuers[issuer]) return;
        _trustedIssuers[issuer] = false;

        uint256 length = _trustedIssuersList.length;
        for (uint256 i = 0; i < length; i++) {
            if (_trustedIssuersList[i] == issuer) {
                _trustedIssuersList[i] = _trustedIssuersList[length - 1];
                _trustedIssuersList.pop();
                break;
            }
        }
        emit TrustedIssuerRemovido(issuer);
    }

    /// @notice Emite uma claim para `carteira`. Restrito a Trusted Issuers atualmente
    /// autorizados. `assinatura` é a evidência off-chain (assinada pelo provedor de KYC)
    /// da verificação; seu hash é consumido uma única vez para impedir replay (SEC-11).
    function emitirClaim(address carteira, bytes32 topico, bytes calldata assinatura) external {
        if (!_trustedIssuers[msg.sender]) revert IssuerNaoAutorizado(msg.sender);

        bytes32 assinaturaHash = keccak256(assinatura);
        if (_assinaturasUsadas[assinaturaHash]) revert AssinaturaJaUtilizada(assinaturaHash);
        _assinaturasUsadas[assinaturaHash] = true;

        _claims[carteira][topico] = Claim({existe: true, issuer: msg.sender});
        emit ClaimEmitida(carteira, topico, msg.sender);
    }

    /// @notice Revoga uma claim. Permitido ao Trusted Issuer que a emitiu ou ao
    /// PLATFORM_ADMIN_ROLE (ex.: KYC expirado, fraude identificada).
    function revogarClaim(address carteira, bytes32 topico) external {
        Claim memory claim = _claims[carteira][topico];
        bool chamadorEhIssuerOriginal = claim.issuer == msg.sender;
        bool chamadorEhAdmin = hasRole(PLATFORM_ADMIN_ROLE, msg.sender);
        if (!chamadorEhIssuerOriginal && !chamadorEhAdmin) {
            revert RevogacaoNaoAutorizada(msg.sender, carteira, topico);
        }

        delete _claims[carteira][topico];
        emit ClaimRevogada(carteira, topico, msg.sender);
    }

    // ---- Funções de leitura ----

    /// @notice True se `carteira` possui a claim mínima exigida (KYC_APPROVED).
    /// A validade do issuer é checada apenas no momento da emissão — remover um
    /// Trusted Issuer não invalida retroativamente claims já emitidas por ele.
    function isVerified(address carteira) external view returns (bool) {
        return _claims[carteira][KYC_APPROVED_TOPIC].existe;
    }

    function temClaim(address carteira, bytes32 topico) external view returns (bool) {
        return _claims[carteira][topico].existe;
    }

    function trustedIssuers() external view returns (address[] memory) {
        return _trustedIssuersList;
    }
}
